import { AiStreamUsage } from 'quidproquo-core';

/**
 * One log line per prompt call with the usage summed across its steps. Warns when nothing was
 * read from or written to the cache: the prefix was under the model's minimum or never matched,
 * and the caller is paying full price while believing it caches.
 */
export const logAiCacheUsage = (usage: AiStreamUsage): void => {
  console.log('AI prompt cache usage:', usage);

  if ((usage.cacheReadInputTokens ?? 0) === 0 && (usage.cacheWriteInputTokens ?? 0) === 0) {
    console.warn('AI prompt caching was requested but nothing was read from or written to the cache');
  }
};
