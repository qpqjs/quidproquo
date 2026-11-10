/**
 * What a model's tokens are priced at, in US dollars per million tokens: a platform's list price,
 * or an app's own rates for what it charges.
 */
export type AiTokenRates = {
  /** Prompt tokens neither read from nor written to the cache. */
  input: number;
  output: number;
  cacheRead: number;
  /** A cache write that lives for five minutes. */
  cacheWriteFiveMinutes: number;
  /** A cache write that lives for an hour. Absent for a model that only caches for five minutes. */
  cacheWriteOneHour?: number;
};
