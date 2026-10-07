import { AiCacheTtl, AiModel } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { toCacheableSystem } from './toCacheableSystem';

const cache = { model: AiModel.ClaudeSonnet46 };

describe('toCacheableSystem', () => {
  it('returns undefined when there is no system prompt', () => {
    expect(toCacheableSystem(undefined, true, cache)).toBeUndefined();
  });

  it('returns the plain string when caching is not requested', () => {
    expect(toCacheableSystem('sys', false, cache)).toBe('sys');
    expect(toCacheableSystem('sys', undefined, cache)).toBe('sys');
  });

  it('wraps the system prompt with a bedrock cache point when caching is requested', () => {
    expect(toCacheableSystem('sys', true, cache)).toEqual({
      role: 'system',
      content: 'sys',
      providerOptions: {
        bedrock: { cachePoint: { type: 'default' } },
      },
    });
  });

  it('carries the one hour ttl on the cache point and omits it otherwise', () => {
    expect(toCacheableSystem('sys', true, { ...cache, cacheTtl: AiCacheTtl.OneHour })).toEqual({
      role: 'system',
      content: 'sys',
      providerOptions: {
        bedrock: { cachePoint: { type: 'default', ttl: '1h' } },
      },
    });

    expect(toCacheableSystem('sys', true, { ...cache, cacheTtl: AiCacheTtl.ProviderDefault })).toEqual(
      toCacheableSystem('sys', true, { ...cache, cacheTtl: AiCacheTtl.FiveMinutes }),
    );
    expect(toCacheableSystem('sys', true, { ...cache, cacheTtl: AiCacheTtl.FiveMinutes })).toEqual({
      role: 'system',
      content: 'sys',
      providerOptions: {
        bedrock: { cachePoint: { type: 'default' } },
      },
    });
  });
});
