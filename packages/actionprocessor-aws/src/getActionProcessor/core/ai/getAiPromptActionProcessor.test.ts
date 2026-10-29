import { AiActionType, AiCacheTtl, AiModel, ErrorTypeEnum } from '@qpqjs/core';
import { invokeProcessor } from '@qpqjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAiPromptActionProcessor } from './getAiPromptActionProcessor';
import {
  buildAiPromptInput,
  createCachePrepareStep,
  logAiCacheUsage,
  prepareAiPromptCall,
  toBedrockReasoningOptions,
  toCacheableSystem,
} from './logic';

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

vi.mock('./logic', async () => ({
  // The real check: a test that mocked it could not tell a guarded reply from an unguarded one.
  generateAiOutputObject: ((await vi.importActual('./logic/generateAiOutputObject')) as typeof import('./logic/generateAiOutputObject'))
    .generateAiOutputObject,
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
const { FakeNoObjectGeneratedError } = vi.hoisted(() => ({
  FakeNoObjectGeneratedError: class extends Error {
    constructor(
      message: string,
      readonly text?: string,
      readonly usage?: { outputTokens: number },
    ) {
      super(message);
    }
  },
}));
vi.mock('ai', () => ({
  generateText: (args: unknown) => generateText(args),
  jsonSchema: (schema: unknown) => ({ jsonSchema: schema }),
  Output: { object: (options: unknown) => ({ objectOutput: options }) },
  NoObjectGeneratedError: { isInstance: (error: unknown) => error instanceof FakeNoObjectGeneratedError },
}));

const loanSchema = {
  type: 'object',
  properties: { applicants: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' } } } } },
  required: ['applicants'],
  additionalProperties: false,
};

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

    expect(error?.errorType).toBe(ErrorTypeEnum.GenericError);
    expect(error?.errorText).toBe('An unexpected error occurred [Error].');
    expect(error?.errorStack).toContain('exploded');
  });

  it('maps a thrown non-Error to a generic message', async () => {
    vi.mocked(prepareAiPromptCall).mockReturnValue({ model: {} as never, tools: undefined });
    generateText.mockRejectedValue('weird');

    const [, error] = await invoke({ prompt: 'hi' });

    expect(error?.errorText).toBe('An error occurred during AI prompt execution.');
  });

  it('asks for no structured output and returns no object without an output schema', async () => {
    vi.mocked(prepareAiPromptCall).mockReturnValue({ model: {} as never, tools: undefined });
    generateText.mockResolvedValue({ text: 'plain', usage: totalUsage });

    const [result] = await invoke({ prompt: 'hi' });

    expect(generateText).toHaveBeenCalledWith(expect.objectContaining({ output: undefined, providerOptions: undefined }));
    expect(result).toEqual({ text: 'plain', usage: totalUsage });
  });

  it('asks for the output schema and returns the reply as the object when it matches', async () => {
    vi.mocked(prepareAiPromptCall).mockReturnValue({ model: {} as never, tools: undefined });
    const reply = { applicants: [{ name: 'Jo' }] };
    generateText.mockResolvedValue({ text: '', output: reply, usage: totalUsage });

    const [result, error] = await invoke({ prompt: 'hi', outputSchema: loanSchema });

    expect(error).toBeUndefined();
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        output: { objectOutput: { schema: { jsonSchema: loanSchema } } },
        providerOptions: { bedrock: { structuredOutputMode: 'jsonTool' } },
      }),
    );
    // Usage is summed across calls, which keeps the standard token fields.
    expect(result).toEqual({ text: '', usage: { inputTokens: totalUsage.inputTokens }, object: reply, repairs: 0 });
  });

  it('keeps reasoning settings beside the json tool mode', async () => {
    vi.mocked(prepareAiPromptCall).mockReturnValue({ model: {} as never, tools: undefined });
    vi.mocked(toBedrockReasoningOptions).mockReturnValueOnce({ bedrock: { reasoningConfig: { type: 'enabled', budgetTokens: 1024 } } } as never);
    generateText.mockResolvedValue({ text: '', output: { applicants: [] }, usage: totalUsage });

    await invoke({ prompt: 'hi', outputSchema: loanSchema });

    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        providerOptions: { bedrock: { reasoningConfig: { type: 'enabled', budgetTokens: 1024 }, structuredOutputMode: 'jsonTool' } },
      }),
    );
  });

  it('refuses a reply with a key the schema does not allow', async () => {
    vi.mocked(prepareAiPromptCall).mockReturnValue({ model: {} as never, tools: undefined });
    generateText.mockResolvedValue({ text: '', output: { applicants: [], total_interest_amount: 5 }, usage: totalUsage });

    const [result, error] = await invoke({ prompt: 'hi', outputSchema: loanSchema });

    expect(result).toBeUndefined();
    expect(error?.errorType).toBe(ErrorTypeEnum.Invalid);
    expect(error?.errorText).toBe('The reply does not match the output schema: (root) must NOT have additional properties (total_interest_amount)');
  });

  it('refuses a reply whose list came back as text', async () => {
    vi.mocked(prepareAiPromptCall).mockReturnValue({ model: {} as never, tools: undefined });
    generateText.mockResolvedValue({ text: '', output: { applicants: '[{"name":"Jo"}]' }, usage: totalUsage });

    const [result, error] = await invoke({ prompt: 'hi', outputSchema: loanSchema });

    expect(result).toBeUndefined();
    expect(error?.errorType).toBe(ErrorTypeEnum.Invalid);
    expect(error?.errorText).toBe('The reply does not match the output schema: /applicants must be array');
  });

  it('shows a refused reply back to the model with the problems, and returns the repaired one', async () => {
    vi.mocked(prepareAiPromptCall).mockReturnValue({ model: {} as never, tools: undefined });
    const repaired = { applicants: [{ name: 'Jo' }] };
    generateText
      .mockResolvedValueOnce({ text: '', output: { applicants: [], total_interest_amount: 5 }, usage: { inputTokens: 100, outputTokens: 10 } })
      .mockResolvedValueOnce({ text: '', output: repaired, usage: { inputTokens: 120, outputTokens: 12 } });

    const [result, error] = await invoke({ prompt: 'read this', outputSchema: loanSchema, outputRepairAttempts: 2 });

    expect(error).toBeUndefined();
    expect(result).toEqual({ text: '', usage: { inputTokens: 220, outputTokens: 22 }, object: repaired, repairs: 1 });
    expect(generateText).toHaveBeenCalledTimes(2);
    expect(generateText.mock.calls[1][0].messages).toEqual([
      { role: 'user', content: 'read this' },
      { role: 'assistant', content: JSON.stringify({ applicants: [], total_interest_amount: 5 }) },
      {
        role: 'user',
        content:
          'That reply does not match the required schema: (root) must NOT have additional properties (total_interest_amount). Send the whole reply again with only those problems fixed, changing nothing else.',
      },
    ]);
  });

  it('refuses once the repairs run out, with the last problems', async () => {
    vi.mocked(prepareAiPromptCall).mockReturnValue({ model: {} as never, tools: undefined });
    generateText
      .mockResolvedValueOnce({ text: '', output: { applicants: 'x' }, usage: totalUsage })
      .mockResolvedValueOnce({ text: '', output: { applicants: [], extra: 1 }, usage: totalUsage })
      .mockResolvedValueOnce({ text: '', output: { applicants: [] }, usage: totalUsage });

    const [result, error] = await invoke({ prompt: 'hi', outputSchema: loanSchema, outputRepairAttempts: 1 });

    expect(result).toBeUndefined();
    expect(generateText).toHaveBeenCalledTimes(2);
    expect(error?.errorType).toBe(ErrorTypeEnum.Invalid);
    expect(error?.errorText).toBe('The reply does not match the output schema: (root) must NOT have additional properties (extra)');
  });

  it('refuses a reply that is not JSON at all when no repair is allowed', async () => {
    vi.mocked(prepareAiPromptCall).mockReturnValue({ model: {} as never, tools: undefined });
    generateText.mockRejectedValue(new FakeNoObjectGeneratedError('No object generated: could not parse the response.', 'Sure! Here it is'));

    const [result, error] = await invoke({ prompt: 'hi', outputSchema: loanSchema });

    expect(result).toBeUndefined();
    expect(error?.errorType).toBe(ErrorTypeEnum.Invalid);
    expect(error?.errorText).toBe('The reply does not match the output schema: the reply is not JSON');
  });

  it('repairs a reply that is not JSON by showing the model its own text, and counts its usage', async () => {
    vi.mocked(prepareAiPromptCall).mockReturnValue({ model: {} as never, tools: undefined });
    const repaired = { applicants: [] };
    generateText
      .mockRejectedValueOnce(new FakeNoObjectGeneratedError('No object generated.', 'Sure! Here it is: {"applicants": [', { outputTokens: 7 }))
      .mockResolvedValueOnce({ text: '', output: repaired, usage: { outputTokens: 5 } });

    const [result, error] = await invoke({ prompt: 'read this', outputSchema: loanSchema, outputRepairAttempts: 1 });

    expect(error).toBeUndefined();
    expect(result).toEqual({ text: '', usage: { outputTokens: 12 }, object: repaired, repairs: 1 });
    expect(generateText.mock.calls[1][0].messages.slice(1)).toEqual([
      { role: 'assistant', content: 'Sure! Here it is: {"applicants": [' },
      {
        role: 'user',
        content:
          'That reply does not match the required schema: the reply is not JSON. Send the whole reply again with only those problems fixed, changing nothing else.',
      },
    ]);
  });
});
