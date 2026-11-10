import { AiStreamFinishReasonEnum, type AiStreamPart, AiStreamPartType } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { getEventDocAiStreamUsage } from './getEventDocAiStreamUsage';

describe('getEventDocAiStreamUsage', () => {
  it('reads the usage off the finish part', () => {
    const usage = { inputTokens: 120, outputTokens: 30, cacheReadInputTokens: 100 };
    const parts: AiStreamPart[] = [
      { type: AiStreamPartType.TextDelta, id: 't', text: 'hi' },
      { type: AiStreamPartType.Finish, finishReason: AiStreamFinishReasonEnum.stop, usage },
    ];

    expect(getEventDocAiStreamUsage(parts)).toEqual(usage);
  });

  it('adds up the finished steps when the stream itself never finished', () => {
    const parts: AiStreamPart[] = [
      { type: AiStreamPartType.FinishStep, finishReason: AiStreamFinishReasonEnum.toolCalls, usage: { inputTokens: 100, costMicroUsd: 40 } },
      { type: AiStreamPartType.FinishStep, finishReason: AiStreamFinishReasonEnum.toolCalls, usage: { inputTokens: 50, costMicroUsd: 2 } },
    ];

    expect(getEventDocAiStreamUsage(parts)).toEqual({ inputTokens: 150, costMicroUsd: 42 });
  });

  it('takes the finish part over the steps, since it already totals them', () => {
    const parts: AiStreamPart[] = [
      { type: AiStreamPartType.FinishStep, finishReason: AiStreamFinishReasonEnum.toolCalls, usage: { inputTokens: 100 } },
      { type: AiStreamPartType.Finish, finishReason: AiStreamFinishReasonEnum.stop, usage: { inputTokens: 100 } },
    ];

    expect(getEventDocAiStreamUsage(parts)).toEqual({ inputTokens: 100 });
  });

  it('returns null when no step finished', () => {
    expect(getEventDocAiStreamUsage([{ type: AiStreamPartType.TextDelta, id: 't', text: 'hi' }])).toBeNull();
  });
});
