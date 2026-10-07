import { AiStreamFinishReasonEnum, type AiStreamPart, AiStreamPartType } from 'quidproquo-core';

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

  it('returns null when the stream never finished', () => {
    expect(getEventDocAiStreamUsage([{ type: AiStreamPartType.TextDelta, id: 't', text: 'hi' }])).toBeNull();
  });
});
