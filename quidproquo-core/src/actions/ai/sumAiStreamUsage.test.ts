import { describe, expect, it } from 'vitest';

import { sumAiStreamUsage } from './sumAiStreamUsage';

describe('sumAiStreamUsage', () => {
  it('adds every reported field across the usages', () => {
    expect(
      sumAiStreamUsage([
        { inputTokens: 100, outputTokens: 10, totalTokens: 110, cacheReadInputTokens: 80, cacheWriteInputTokens: 15, noCacheInputTokens: 5 },
        { inputTokens: 200, outputTokens: 20, totalTokens: 220, cacheReadInputTokens: 190, cacheWriteInputTokens: 5, noCacheInputTokens: 5 },
      ]),
    ).toEqual({ inputTokens: 300, outputTokens: 30, totalTokens: 330, cacheReadInputTokens: 270, cacheWriteInputTokens: 20, noCacheInputTokens: 10 });
  });

  it('leaves a field undefined when no usage reported it', () => {
    const sum = sumAiStreamUsage([{ inputTokens: 1 }, { inputTokens: 2, outputTokens: 3 }]);

    expect(sum).toEqual({ inputTokens: 3, outputTokens: 3 });
    expect(sum).not.toHaveProperty('cacheReadInputTokens');
  });

  it('sums nothing to an empty usage', () => {
    expect(sumAiStreamUsage([])).toEqual({});
  });
});
