import { AiActionType, AiCacheTtl, AiModel, ErrorTypeEnum } from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getAiPromptActionProcessor } from './getAiPromptActionProcessor';
import { buildAiPromptInput, createCachePrepareStep, logAiCacheUsage, prepareAiPromptCall, toCacheableSystem } from './logic';

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
  toCacheableSystem: vi.fn((system: string | undefined) => system),
  createCachePrepareStep: vi.fn(() => 'prepare-step'),
  toAiStreamUsage: vi.fn((usage: unknown) => usage),
  logAiCacheUsage: vi.fn(),
  buildAiStopConditions: vi.fn(() => []),
  toBedrockReasoningOptions: vi.fn(() => undefined),
}));

const generateText = vi.fn();
vi.mock('ai', () => ({
  generateText: (args: unknown) => generateText(args),
}));

const invoke = async (payload: Record<string, unknown>) => {
  const processor = (await getAiPromptActionProcessor({} as never, null as any))[AiActionType.Prompt];
  return invokeProcessor(processor, payload);
};

const totalUsage = { inputTokens: 24281, inputTokenDetails: { noCacheTokens: 12, cacheReadTokens: 24112, cacheWriteTokens: 157 } };

describe('getProcessAiPrompt', () => {
  beforeEach(() => {
    vi.mocked(prepareAiPromptCall).mockReset();
    vi.mocked(createCachePrepareStep).mockClear();
    vi.mocked(logAiCacheUsage).mockClear();
    vi.mocked(toCacheableSystem).mockReset();
    vi.mocked(toCacheableSystem).mockImplementation((system: string | undefined) => system);
    generateText.mockReset();
  });

  it('returns an action error when preparation fails', async () => {
    vi.mocked(prepareAiPromptCall).mockReturnValue({ error: { type: ErrorTypeEnum.NotFound, message: 'no ai' } });

    const [result, error] = await invoke({ prompt: 'hi' });

    expect(result).toBeUndefined();
    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
  });

  it('generates text from a prompt payload and returns the total usage', async () => {
    vi.mocked(prepareAiPromptCall).mockReturnValue({ model: { id: 'm' } as never, tools: undefined });
    generateText.mockResolvedValue({ text: 'hello world', usage: totalUsage });

    const [result] = await invoke({ prompt: 'hi', system: 'sys' });

    expect(result).toEqual({ text: 'hello world', usage: totalUsage });
    expect(generateText).toHaveBeenCalledWith(expect.objectContaining({ prompt: 'hi', system: 'sys', prepareStep: undefined }));
    expect(createCachePrepareStep).not.toHaveBeenCalled();
    expect(logAiCacheUsage).not.toHaveBeenCalled();
  });

  it('passes system, caching and the ttl through to toCacheableSystem', async () => {
    vi.mocked(prepareAiPromptCall).mockReturnValue({ model: { id: 'm' } as never, tools: undefined });
    generateText.mockResolvedValue({ text: 'ok', usage: totalUsage });
    vi.mocked(toCacheableSystem).mockReturnValue({
      role: 'system',
      content: 'sys',
      providerOptions: { bedrock: { cachePoint: { type: 'default', ttl: '1h' } } },
    });

    await invoke({ model: AiModel.ClaudeSonnet46, prompt: 'hi', system: 'sys', caching: true, cacheTtl: AiCacheTtl.OneHour });

    expect(toCacheableSystem).toHaveBeenCalledWith('sys', true, { model: AiModel.ClaudeSonnet46, cacheTtl: AiCacheTtl.OneHour });
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        system: { role: 'system', content: 'sys', providerOptions: { bedrock: { cachePoint: { type: 'default', ttl: '1h' } } } },
      }),
    );
  });

  it('sends the history then the turn context and installs the cache step hook when caching', async () => {
    vi.mocked(prepareAiPromptCall).mockReturnValue({ model: { id: 'm' } as never, tools: undefined });
    generateText.mockResolvedValue({ text: 'ok', usage: totalUsage });
    const messages = [
      { role: 'user', content: 'q1' },
      { role: 'assistant', content: 'a1' },
    ];
    const turnContext = [{ role: 'user', content: 'current state' }];

    await invoke({ model: AiModel.ClaudeSonnet46, prompt: 'ignored', messages, turnContext, caching: true, cacheTtl: AiCacheTtl.OneHour });

    expect(buildAiPromptInput).toHaveBeenCalledWith(expect.objectContaining({ messages, turnContext }), expect.any(Function));
    expect(createCachePrepareStep).toHaveBeenCalledWith({ model: AiModel.ClaudeSonnet46, cacheTtl: AiCacheTtl.OneHour, durableCount: 2 });
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [...messages, ...turnContext],
        prepareStep: 'prepare-step',
      }),
    );
    expect(generateText.mock.calls[0][0]).not.toHaveProperty('prompt');
  });

  it('logs the total cache usage when caching is on', async () => {
    vi.mocked(prepareAiPromptCall).mockReturnValue({ model: { id: 'm' } as never, tools: undefined });
    generateText.mockResolvedValue({ text: 'ok', usage: totalUsage });

    const [result] = await invoke({ prompt: 'hi', caching: true });

    expect(logAiCacheUsage).toHaveBeenCalledWith(totalUsage);
    expect(result).toEqual({ text: 'ok', usage: totalUsage });
  });

  it('maps a thrown Error to a GenericError result', async () => {
    vi.mocked(prepareAiPromptCall).mockReturnValue({ model: {} as never, tools: undefined });
    generateText.mockRejectedValue(new Error('exploded'));

    const [, error] = await invoke({ prompt: 'hi' });

    expect(error).toEqual({ errorType: ErrorTypeEnum.GenericError, errorText: 'exploded', errorStack: undefined });
  });

  it('maps a thrown non-Error to a generic message', async () => {
    vi.mocked(prepareAiPromptCall).mockReturnValue({ model: {} as never, tools: undefined });
    generateText.mockRejectedValue('weird');

    const [, error] = await invoke({ prompt: 'hi' });

    expect(error?.errorText).toBe('An error occurred during AI prompt execution.');
  });
});
