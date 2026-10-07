import { AiActionType, AiCacheTtl, AiModel, ErrorTypeEnum } from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getAiPromptStreamActionProcessor } from './getAiPromptStreamActionProcessor';
import { buildAiPromptInput, createCachePrepareStep, logAiCacheUsage, mapAiStreamPart, prepareAiPromptCall, toCacheableSystem } from './logic';

// Echoes the payload so the order history -> turn context is observable in the SDK call.
const { echoPromptInput } = vi.hoisted(() => ({
  echoPromptInput: async (payload: { prompt: string; messages?: unknown[]; turnContext?: unknown[] }) => {
    const turnContext = payload.turnContext ?? [];
    if (!payload.messages && turnContext.length === 0) {
      return { promptOrMessages: { prompt: payload.prompt }, durableCount: 0 };
    }
    const durable = payload.messages ?? [{ role: 'user', content: payload.prompt }];
    return { promptOrMessages: { messages: [...durable, ...turnContext] }, durableCount: durable.length };
  },
}));

vi.mock('./logic', () => ({
  prepareAiPromptCall: vi.fn(),
  createDriveFileResolver: vi.fn(() => vi.fn()),
  buildAiPromptInput: vi.fn(echoPromptInput),
  mapAiStreamPart: vi.fn(() => ({ mapped: true })),
  toCacheableSystem: vi.fn((system: string | undefined) => system),
  createCachePrepareStep: vi.fn(() => 'prepare-step'),
  toAiStreamUsage: vi.fn((usage: unknown) => usage),
  logAiCacheUsage: vi.fn(),
  toErrorMessage: vi.fn((error: unknown) => (error instanceof Error ? error.message : String(error))),
  buildAiStopConditions: vi.fn(() => []),
}));

const streamText = vi.fn();
vi.mock('ai', () => ({
  streamText: (args: unknown) => streamText(args),
}));

vi.mock('../../../awsLambdaUtils', () => ({ randomGuid: () => 'guid' }));

const buildRegistry = () => ({ register: vi.fn() });

const invoke = async (payload: Record<string, unknown>, streamRegistry: unknown) => {
  const processor = (await getAiPromptStreamActionProcessor({} as never, null as any))[AiActionType.PromptStream];
  return invokeProcessor(processor, payload, { streamRegistry });
};

const drain = async (registry: { register: ReturnType<typeof vi.fn> }): Promise<string[]> => {
  const iterator = registry.register.mock.calls[0][1] as AsyncIterableIterator<string>;
  const chunks: string[] = [];
  for await (const chunk of iterator) {
    chunks.push(chunk);
  }
  return chunks;
};

const totalUsage = { inputTokens: 24281, inputTokenDetails: { noCacheTokens: 12, cacheReadTokens: 24112, cacheWriteTokens: 157 } };

const textDeltaStream = () =>
  (async function* () {
    yield { type: 'text-delta' };
  })();

describe('getProcessAiPromptStream', () => {
  beforeEach(() => {
    vi.mocked(prepareAiPromptCall).mockReset();
    vi.mocked(createCachePrepareStep).mockClear();
    vi.mocked(logAiCacheUsage).mockClear();
    vi.mocked(toCacheableSystem).mockReset();
    vi.mocked(toCacheableSystem).mockImplementation((system: string | undefined) => system);
    streamText.mockReset();
  });

  it('returns an action error when preparation fails', async () => {
    vi.mocked(prepareAiPromptCall).mockReturnValue({ error: { type: ErrorTypeEnum.NotImplemented, message: 'bad model' } });

    const [result, error] = await invoke({ prompt: 'hi' }, buildRegistry());

    expect(result).toBeUndefined();
    expect(error?.errorType).toBe(ErrorTypeEnum.NotImplemented);
  });

  it('registers a json-encoded stream and returns its id', async () => {
    vi.mocked(prepareAiPromptCall).mockReturnValue({ model: {} as never, tools: undefined });
    streamText.mockReturnValue({ stream: textDeltaStream(), usage: Promise.resolve(totalUsage) });
    const registry = buildRegistry();

    const [result] = await invoke({ prompt: 'hi' }, registry);

    expect(result?.encoding).toBe('json');
    expect(result?.id).toContain('ai-prompt-');
    expect(registry.register).toHaveBeenCalledWith(result?.id, expect.anything());
    expect(await drain(registry)).toEqual([JSON.stringify({ mapped: true })]);
    expect(mapAiStreamPart).toHaveBeenCalledWith({ type: 'text-delta' });
    expect(streamText).toHaveBeenCalledWith(expect.objectContaining({ prompt: 'hi', prepareStep: undefined }));
    expect(createCachePrepareStep).not.toHaveBeenCalled();
  });

  it('passes system, caching and the ttl through to toCacheableSystem', async () => {
    vi.mocked(prepareAiPromptCall).mockReturnValue({ model: {} as never, tools: undefined });
    vi.mocked(toCacheableSystem).mockReturnValue({
      role: 'system',
      content: 'sys',
      providerOptions: { bedrock: { cachePoint: { type: 'default', ttl: '1h' } } },
    });
    streamText.mockReturnValue({ stream: (async function* () {})(), usage: Promise.resolve(totalUsage) });

    await invoke({ model: AiModel.ClaudeSonnet46, prompt: 'hi', system: 'sys', caching: true, cacheTtl: AiCacheTtl.OneHour }, buildRegistry());

    expect(toCacheableSystem).toHaveBeenCalledWith('sys', true, { model: AiModel.ClaudeSonnet46, cacheTtl: AiCacheTtl.OneHour });
    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        system: { role: 'system', content: 'sys', providerOptions: { bedrock: { cachePoint: { type: 'default', ttl: '1h' } } } },
      }),
    );
  });

  it('sends the history then the turn context and installs the cache step hook when caching', async () => {
    vi.mocked(prepareAiPromptCall).mockReturnValue({ model: {} as never, tools: undefined });
    streamText.mockReturnValue({ stream: (async function* () {})(), usage: Promise.resolve(totalUsage) });
    const messages = [
      { role: 'user', content: 'q1' },
      { role: 'assistant', content: 'a1' },
    ];
    const turnContext = [{ role: 'user', content: 'current state' }];

    await invoke(
      { model: AiModel.ClaudeSonnet46, prompt: 'ignored', messages, turnContext, caching: true, cacheTtl: AiCacheTtl.OneHour },
      buildRegistry(),
    );

    expect(buildAiPromptInput).toHaveBeenCalledWith(expect.objectContaining({ messages, turnContext }), expect.any(Function));
    expect(createCachePrepareStep).toHaveBeenCalledWith({ model: AiModel.ClaudeSonnet46, cacheTtl: AiCacheTtl.OneHour, durableCount: 2 });
    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [...messages, ...turnContext],
        prepareStep: 'prepare-step',
      }),
    );
    expect(streamText.mock.calls[0][0]).not.toHaveProperty('prompt');
  });

  it('logs the total cache usage once the stream is fully consumed', async () => {
    vi.mocked(prepareAiPromptCall).mockReturnValue({ model: {} as never, tools: undefined });
    streamText.mockReturnValue({ stream: textDeltaStream(), usage: Promise.resolve(totalUsage) });
    const registry = buildRegistry();

    await invoke({ prompt: 'hi', caching: true }, registry);

    expect(logAiCacheUsage).not.toHaveBeenCalled();
    await drain(registry);
    expect(logAiCacheUsage).toHaveBeenCalledWith(totalUsage);
  });

  it('does not log cache usage when caching is off', async () => {
    vi.mocked(prepareAiPromptCall).mockReturnValue({ model: {} as never, tools: undefined });
    streamText.mockReturnValue({ stream: textDeltaStream(), usage: Promise.resolve(totalUsage) });
    const registry = buildRegistry();

    await invoke({ prompt: 'hi' }, registry);
    await drain(registry);

    expect(logAiCacheUsage).not.toHaveBeenCalled();
  });

  it('warns instead of throwing when the usage is unavailable after a failed stream', async () => {
    vi.mocked(prepareAiPromptCall).mockReturnValue({ model: {} as never, tools: undefined });
    const unavailable = Promise.reject(new Error('No output generated'));
    unavailable.catch(() => {});
    streamText.mockReturnValue({ stream: textDeltaStream(), usage: unavailable });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const registry = buildRegistry();

    await invoke({ prompt: 'hi', caching: true }, registry);
    await drain(registry);

    expect(logAiCacheUsage).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith('AI prompt cache usage unavailable:', 'No output generated');
    warnSpy.mockRestore();
  });

  it('maps a thrown Error to a GenericError result', async () => {
    vi.mocked(prepareAiPromptCall).mockReturnValue({ model: {} as never, tools: undefined });
    streamText.mockImplementation(() => {
      throw new Error('stream boom');
    });

    const [, error] = await invoke({ prompt: 'hi' }, buildRegistry());

    expect(error).toEqual({ errorType: ErrorTypeEnum.GenericError, errorText: 'stream boom', errorStack: undefined });
  });

  it('maps a thrown non-Error to a generic message', async () => {
    vi.mocked(prepareAiPromptCall).mockReturnValue({ model: {} as never, tools: undefined });
    streamText.mockImplementation(() => {
      throw 'weird';
    });

    const [, error] = await invoke({ prompt: 'hi' }, buildRegistry());

    expect(error?.errorText).toBe('An error occurred during AI prompt stream.');
  });
});
