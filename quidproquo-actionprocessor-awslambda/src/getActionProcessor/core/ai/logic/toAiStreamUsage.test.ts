import { describe, expect, it } from 'vitest';

import { toAiStreamUsage } from './toAiStreamUsage';

describe('toAiStreamUsage', () => {
  it('copies the token counts across', () => {
    expect(toAiStreamUsage({ inputTokens: 1, outputTokens: 2, totalTokens: 3 })).toEqual({
      inputTokens: 1,
      outputTokens: 2,
      totalTokens: 3,
    });
  });

  it('passes through undefined token counts', () => {
    expect(toAiStreamUsage({})).toEqual({
      inputTokens: undefined,
      outputTokens: undefined,
      totalTokens: undefined,
    });
  });

  it('maps the cache breakdown when the provider reports it', () => {
    expect(
      toAiStreamUsage({
        inputTokens: 24281,
        outputTokens: 40,
        totalTokens: 24321,
        inputTokenDetails: { noCacheTokens: 12, cacheReadTokens: 24112, cacheWriteTokens: 157 },
      }),
    ).toEqual({
      inputTokens: 24281,
      outputTokens: 40,
      totalTokens: 24321,
      cacheReadInputTokens: 24112,
      cacheWriteInputTokens: 157,
      noCacheInputTokens: 12,
    });
  });

  it('leaves the cache fields undefined without a breakdown', () => {
    const usage = toAiStreamUsage({ inputTokens: 1 });

    expect(usage.cacheReadInputTokens).toBeUndefined();
    expect(usage.cacheWriteInputTokens).toBeUndefined();
    expect(usage.noCacheInputTokens).toBeUndefined();
  });
});
