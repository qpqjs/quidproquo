import { AiStreamUsage } from './types/AiStreamUsage';
import { AiTokenRates } from './types/AiTokenRates';
import { AiCacheTtl } from './AiCacheTtl';

/**
 * What a call's tokens come to at `rates`, in millionths of a US dollar, rounded to a whole number
 * so totals add up exactly. Cache writes are priced at the five minute rate only when every write
 * lived for five minutes (`cacheTtl` FiveMinutes); otherwise at the hour rate, the dearer one.
 */
export const getAiUsageAmountMicroUsd = (usage: AiStreamUsage, rates: AiTokenRates, cacheTtl?: AiCacheTtl): number => {
  const cacheReadTokens = usage.cacheReadInputTokens ?? 0;
  const cacheWriteTokens = usage.cacheWriteInputTokens ?? 0;

  // `inputTokens` is the total of the three input kinds, so only the uncached part is priced as input.
  const noCacheTokens = usage.noCacheInputTokens ?? Math.max(0, (usage.inputTokens ?? 0) - cacheReadTokens - cacheWriteTokens);

  const cacheWriteRate = cacheTtl === AiCacheTtl.FiveMinutes ? rates.cacheWriteFiveMinutes : (rates.cacheWriteOneHour ?? rates.cacheWriteFiveMinutes);

  // A rate per million tokens times a token count is already millionths of a dollar.
  return Math.round(
    noCacheTokens * rates.input + cacheReadTokens * rates.cacheRead + cacheWriteTokens * cacheWriteRate + (usage.outputTokens ?? 0) * rates.output,
  );
};
