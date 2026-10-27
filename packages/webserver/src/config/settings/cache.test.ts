import { describe, expect, it } from 'vitest';

import { CacheSettings, QPQWebServerConfigSettingType } from '../QPQConfig';
import { defineCache } from './cache';

const cacheSettings: CacheSettings = {
  minTTLInSeconds: 1,
  maxTTLInSeconds: 100,
  defaultTTLInSeconds: 10,
  mustRevalidate: true,
};

describe('defineCache', () => {
  it('builds a Cache setting with no owner by default', () => {
    expect(defineCache('cdn', cacheSettings)).toEqual({
      configSettingType: QPQWebServerConfigSettingType.Cache,
      uniqueKey: 'cdn',
      name: 'cdn',
      cache: cacheSettings,
      owner: undefined,
    });
  });

  it('derives the owner override from the cross-module owner', () => {
    const setting = defineCache('cdn', cacheSettings, { owner: { module: 'web', cacheName: 'shared' } });

    expect(setting.owner).toEqual({ module: 'web', cacheName: 'shared', resourceNameOverride: 'shared' });
  });
});
