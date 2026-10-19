import { AiStreamUsage } from 'quidproquo-core';

/**
 * Warns when nothing was read from or written to the cache: the prefix was under the model's
 * minimum or never matched, and the caller is paying full price while believing it caches.
 * The usage itself reaches the story log through the action result.
 */
export const logAiCacheUsage = (usage: AiStreamUsage): void => {
  if ((usage.cacheReadInputTokens ?? 0) === 0 && (usage.cacheWriteInputTokens ?? 0) === 0) {
    console.warn('AI prompt caching was requested but nothing was read from or written to the cache');
  }
};
