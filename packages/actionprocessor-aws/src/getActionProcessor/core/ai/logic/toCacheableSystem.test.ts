import { AiCacheTtl, AiModel } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { toCacheableSystem } from './toCacheableSystem';

const cache = { model: AiModel.ClaudeSonnet46 };

const systemWith = (cachePoint: object) => ({
  role: 'system',
  content: 'sys',
  providerOptions: { bedrock: { cachePoint } },
});

describe('toCacheableSystem', () => {
  it('returns undefined when there is no system prompt', () => {
    expect(toCacheableSystem(undefined, true, cache)).toBeUndefined();
  });

  it('returns the plain string when caching is not requested', () => {
    expect(toCacheableSystem('sys', false, cache)).toBe('sys');
    expect(toCacheableSystem('sys', undefined, cache)).toBe('sys');
  });

  it('wraps the system prompt with an hour-long bedrock cache point by default', () => {
    expect(toCacheableSystem('sys', true, cache)).toEqual(systemWith({ type: 'default', ttl: '1h' }));
  });

  it('uses the default lifetime by default on a model that cannot cache for an hour', () => {
    expect(toCacheableSystem('sys', true, { model: AiModel.ClaudeSonnet4 })).toEqual(systemWith({ type: 'default' }));
  });

  it('honours an explicit lifetime', () => {
    expect(toCacheableSystem('sys', true, { ...cache, cacheTtl: AiCacheTtl.OneHour })).toEqual(systemWith({ type: 'default', ttl: '1h' }));
    expect(toCacheableSystem('sys', true, { ...cache, cacheTtl: AiCacheTtl.FiveMinutes })).toEqual(systemWith({ type: 'default' }));
    expect(toCacheableSystem('sys', true, { ...cache, cacheTtl: AiCacheTtl.ProviderDefault })).toEqual(systemWith({ type: 'default' }));
  });
});
