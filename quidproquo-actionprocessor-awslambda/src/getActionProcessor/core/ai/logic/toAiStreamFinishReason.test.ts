import { AiStreamFinishReasonEnum } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { toAiStreamFinishReason } from './toAiStreamFinishReason';

describe('toAiStreamFinishReason', () => {
  it('passes a known AI SDK reason through', () => {
    expect(toAiStreamFinishReason('stop')).toBe(AiStreamFinishReasonEnum.stop);
    expect(toAiStreamFinishReason('content-filter', 'content_filtered')).toBe(AiStreamFinishReasonEnum.contentFilter);
  });

  it('degrades a reason it does not know to unknown', () => {
    expect(toAiStreamFinishReason('something-new')).toBe(AiStreamFinishReasonEnum.unknown);
    expect(toAiStreamFinishReason('other', 'model_context_window_exceeded')).toBe(AiStreamFinishReasonEnum.other);
  });

  it("reports Anthropic's raw refusal as a content filter whatever the SDK made of it", () => {
    expect(toAiStreamFinishReason('other', 'refusal')).toBe(AiStreamFinishReasonEnum.contentFilter);
    expect(toAiStreamFinishReason('stop', 'refusal')).toBe(AiStreamFinishReasonEnum.contentFilter);
  });
});
