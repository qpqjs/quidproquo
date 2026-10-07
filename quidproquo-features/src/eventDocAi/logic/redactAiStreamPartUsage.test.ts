import { AiStreamFinishReasonEnum, type AiStreamPart, AiStreamPartType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { redactAiStreamPartUsage } from './redactAiStreamPartUsage';

describe('redactAiStreamPartUsage', () => {
  it('empties the usage on finish and finish-step parts', () => {
    const usage = { inputTokens: 120, cacheReadInputTokens: 100 };

    expect(redactAiStreamPartUsage({ type: AiStreamPartType.Finish, finishReason: AiStreamFinishReasonEnum.stop, usage })).toEqual({
      type: AiStreamPartType.Finish,
      finishReason: AiStreamFinishReasonEnum.stop,
      usage: {},
    });
    expect(redactAiStreamPartUsage({ type: AiStreamPartType.FinishStep, finishReason: AiStreamFinishReasonEnum.toolCalls, usage })).toEqual({
      type: AiStreamPartType.FinishStep,
      finishReason: AiStreamFinishReasonEnum.toolCalls,
      usage: {},
    });
  });

  it('passes other parts through untouched', () => {
    const part: AiStreamPart = { type: AiStreamPartType.TextDelta, id: 't', text: 'hi' };

    expect(redactAiStreamPartUsage(part)).toBe(part);
  });
});
