import { describe, expect, it } from 'vitest';

import { AiTokenRates } from './types/AiTokenRates';
import { AiCacheTtl } from './AiCacheTtl';
import { getAiUsageAmountMicroUsd } from './getAiUsageAmountMicroUsd';

// Distinct rates per kind, so a token priced at the wrong rate shows in the total.
const RATES: AiTokenRates = { input: 3, output: 15, cacheRead: 0.3, cacheWriteFiveMinutes: 3.75, cacheWriteOneHour: 6 };

describe('getAiUsageAmountMicroUsd', () => {
  it('prices each kind of token at its own rate, a rate per million tokens giving millionths of a dollar', () => {
    // 1,000 uncached x 3 + 10,000 read x 0.3 + 100 written x 6 + 500 out x 15
    expect(
      getAiUsageAmountMicroUsd(
        { inputTokens: 11_100, noCacheInputTokens: 1_000, cacheReadInputTokens: 10_000, cacheWriteInputTokens: 100, outputTokens: 500 },
        RATES,
      ),
    ).toBe(3_000 + 3_000 + 600 + 7_500);
  });

  it('never prices the input total on top of its parts', () => {
    expect(getAiUsageAmountMicroUsd({ inputTokens: 1_100, noCacheInputTokens: 100, cacheReadInputTokens: 1_000 }, RATES)).toBe(300 + 300);
  });

  it('works out the uncached part from the total when the provider only reports the total', () => {
    expect(getAiUsageAmountMicroUsd({ inputTokens: 1_100, cacheReadInputTokens: 1_000 }, RATES)).toBe(300 + 300);
  });

  it('prices cache writes at the five minute rate only when every write lived five minutes', () => {
    expect(getAiUsageAmountMicroUsd({ cacheWriteInputTokens: 1_000 }, RATES, AiCacheTtl.FiveMinutes)).toBe(3_750);
  });

  it.each([AiCacheTtl.OneHour, AiCacheTtl.Dynamic, AiCacheTtl.ProviderDefault, undefined])(
    'prices cache writes at the hour rate for %s',
    (cacheTtl?: AiCacheTtl) => {
      expect(getAiUsageAmountMicroUsd({ cacheWriteInputTokens: 1_000 }, RATES, cacheTtl)).toBe(6_000);
    },
  );

  it('prices cache writes at the five minute rate for a model with no hour rate', () => {
    const fiveMinutesOnly: AiTokenRates = { input: 3, output: 15, cacheRead: 0.3, cacheWriteFiveMinutes: 3.75 };

    expect(getAiUsageAmountMicroUsd({ cacheWriteInputTokens: 1_000 }, fiveMinutesOnly, AiCacheTtl.OneHour)).toBe(3_750);
  });

  it('rounds to a whole number of millionths', () => {
    expect(getAiUsageAmountMicroUsd({ noCacheInputTokens: 3 }, { ...RATES, input: 0.8 })).toBe(2);
  });

  it('comes to nothing for a usage with no tokens', () => {
    expect(getAiUsageAmountMicroUsd({}, RATES)).toBe(0);
  });
});
