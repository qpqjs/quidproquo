import { buildTestQpqConfig } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { CacheSettings } from '../../../QPQConfig';
import { defineCache } from '../defineCache';
import { getAllCacheConfigs } from './getAllCacheConfigs';
import { getCacheByName } from './getCacheByName';
import { getOwnedCacheConfigs } from './getOwnedCacheConfigs';
import { resolveCacheOrThrow } from './resolveCacheOrThrow';

const cacheSettings: CacheSettings = { minTTLInSeconds: 1, maxTTLInSeconds: 100, defaultTTLInSeconds: 10, mustRevalidate: false };

const config = buildTestQpqConfig([
  defineCache('cdn', cacheSettings),
  defineCache('theirs', cacheSettings, { owner: { module: 'other', cacheName: 'theirs' } }),
]);

describe('cache accessors', () => {
  it('lists every cache, and only the owned ones', () => {
    expect(getAllCacheConfigs(config).map((cache) => cache.name)).toEqual(['cdn', 'theirs']);
    expect(getOwnedCacheConfigs(config).map((cache) => cache.name)).toEqual(['cdn']);
  });

  it('finds a cache by name, null when unknown', () => {
    expect(getCacheByName('cdn', config)?.name).toBe('cdn');
    expect(getCacheByName('missing', config)).toBeNull();
  });

  it('resolves a cache by name or throws naming it', () => {
    expect(resolveCacheOrThrow('theirs', config).name).toBe('theirs');
    expect(() => resolveCacheOrThrow('missing', config)).toThrow('No cache config found for name [missing]');
  });
});
