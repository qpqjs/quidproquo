import { AiActionType, ErrorTypeEnum } from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getAiPromptActionProcessor } from './getAiPromptActionProcessor';
import { prepareAiPromptCall, toCacheableMessages, toCacheableSystem, toSdkMessages } from './logic';

vi.mock('./logic', () => ({
  prepareAiPromptCall: vi.fn(),
  createDriveFileResolver: vi.fn(() => vi.fn()),
  toSdkMessages: vi.fn(async () => [{ role: 'user', content: 'mapped' }]),
  toCacheableSystem: vi.fn((system: string | undefined) => system),
  toCacheableMessages: vi.fn((messages: unknown) => messages),
  buildAiStopConditions: vi.fn(() => []),
}));

const generateText = vi.fn();
vi.mock('ai', () => ({
  generateText: (args: unknown) => generateText(args),
}));

const invoke = async (payload: Record<string, unknown>) => {
  const processor = (await getAiPromptActionProcessor({} as never, null as any))[AiActionType.Prompt];
  return invokeProcessor(processor, payload);
};

describe('getProcessAiPrompt', () => {
  beforeEach(() => {
    vi.mocked(prepareAiPromptCall).mockReset();
    generateText.mockReset();
  });

  it('returns an action error when preparation fails', async () => {
    vi.mocked(prepareAiPromptCall).mockReturnValue({ error: { type: ErrorTypeEnum.NotFound, message: 'no ai' } });

    const [result, error] = await invoke({ prompt: 'hi' });

    expect(result).toBeUndefined();
    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
  });

  it('generates text from a prompt payload', async () => {
    vi.mocked(prepareAiPromptCall).mockReturnValue({ model: { id: 'm' } as never, tools: undefined });
    generateText.mockResolvedValue({ text: 'hello world' });

    const [result] = await invoke({ prompt: 'hi', system: 'sys' });

    expect(result).toEqual({ text: 'hello world' });
    expect(generateText).toHaveBeenCalledWith(expect.objectContaining({ prompt: 'hi', system: 'sys' }));
  });

  it('passes system and caching through to toCacheableSystem', async () => {
    vi.mocked(prepareAiPromptCall).mockReturnValue({ model: { id: 'm' } as never, tools: undefined });
    generateText.mockResolvedValue({ text: 'ok', finalStep: {} });
    vi.mocked(toCacheableSystem).mockReturnValue({
      role: 'system',
      content: 'sys',
      providerOptions: { bedrock: { cachePoint: { type: 'default' } } },
    });

    const [result] = await invoke({ prompt: 'hi', system: 'sys', caching: true });

    expect(result).toEqual({ text: 'ok' });
    expect(toCacheableSystem).toHaveBeenCalledWith('sys', true);
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        system: { role: 'system', content: 'sys', providerOptions: { bedrock: { cachePoint: { type: 'default' } } } },
      }),
    );
  });

  it('logs cache usage from finalStep.usage.inputTokenDetails when caching is on', async () => {
    vi.mocked(prepareAiPromptCall).mockReturnValue({ model: { id: 'm' } as never, tools: undefined });
    generateText.mockResolvedValue({
      text: 'ok',
      finalStep: { usage: { inputTokenDetails: { noCacheTokens: 12, cacheReadTokens: 24112, cacheWriteTokens: 157 } } },
    });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await invoke({ prompt: 'hi', caching: true });

    expect(logSpy).toHaveBeenCalledWith('AI prompt cache usage:', { noCacheTokens: 12, cacheReadTokens: 24112, cacheWriteTokens: 157 });
    logSpy.mockRestore();
  });

  it('does not log cache usage when caching is off', async () => {
    vi.mocked(prepareAiPromptCall).mockReturnValue({ model: { id: 'm' } as never, tools: undefined });
    generateText.mockResolvedValue({ text: 'ok', finalStep: { usage: { inputTokenDetails: { cacheReadTokens: 24112 } } } });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await invoke({ prompt: 'hi' });

    expect(logSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('maps messages when the payload carries them', async () => {
    vi.mocked(prepareAiPromptCall).mockReturnValue({ model: { id: 'm' } as never, tools: undefined });
    generateText.mockResolvedValue({ text: 'ok' });

    await invoke({ messages: [{ role: 'user', content: 'hi' }] });

    expect(toSdkMessages).toHaveBeenCalled();
    expect(generateText).toHaveBeenCalledWith(expect.objectContaining({ messages: [{ role: 'user', content: 'mapped' }] }));
  });

  it('passes mapped messages and caching through to toCacheableMessages', async () => {
    vi.mocked(prepareAiPromptCall).mockReturnValue({ model: { id: 'm' } as never, tools: undefined });
    generateText.mockResolvedValue({ text: 'ok', finalStep: {} });
    vi.mocked(toCacheableMessages).mockReturnValue([
      { role: 'user', content: 'mapped', providerOptions: { bedrock: { cachePoint: { type: 'default' } } } },
    ]);

    const [result] = await invoke({ messages: [{ role: 'user', content: 'hi' }], caching: true });

    expect(result).toEqual({ text: 'ok' });
    expect(toCacheableMessages).toHaveBeenCalledWith([{ role: 'user', content: 'mapped' }], true);
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: 'user', content: 'mapped', providerOptions: { bedrock: { cachePoint: { type: 'default' } } } }],
      }),
    );
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
