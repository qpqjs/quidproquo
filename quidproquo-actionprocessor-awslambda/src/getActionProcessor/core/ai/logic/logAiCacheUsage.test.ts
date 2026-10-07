import { afterEach, describe, expect, it, vi } from 'vitest';

import { logAiCacheUsage } from './logAiCacheUsage';

describe('logAiCacheUsage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs the usage and stays quiet when the cache was used', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const usage = { inputTokens: 100, cacheReadInputTokens: 90, cacheWriteInputTokens: 0, noCacheInputTokens: 10 };

    logAiCacheUsage(usage);

    expect(logSpy).toHaveBeenCalledWith('AI prompt cache usage:', usage);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('does not warn when the request only wrote to the cache', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    logAiCacheUsage({ cacheReadInputTokens: 0, cacheWriteInputTokens: 1200 });

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('warns when nothing was read from or written to the cache', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    logAiCacheUsage({ inputTokens: 300, cacheReadInputTokens: 0, cacheWriteInputTokens: 0, noCacheInputTokens: 300 });
    logAiCacheUsage({ inputTokens: 300 });

    expect(warnSpy).toHaveBeenCalledTimes(2);
  });
});
