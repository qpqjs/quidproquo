import { generateSimpleHash } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { QPQWebServerConfigSettingType } from '../QPQConfig';
import { defineSeo } from './seo';

const runtime = '/src/seo/home::home';

describe('defineSeo', () => {
  it('builds a Seo setting keyed by the hashed path with defaults', () => {
    expect(defineSeo('/home', runtime)).toEqual({
      configSettingType: QPQWebServerConfigSettingType.Seo,
      uniqueKey: generateSimpleHash('/home'),
      path: '/home',
      runtime,
      webEntry: undefined,
      deprecated: false,
      cacheSettingsName: undefined,
    });
  });

  it('carries the advanced options', () => {
    const setting = defineSeo('/home', runtime, { webEntry: 'site', deprecated: true, cacheSettingsName: 'cdn' });

    expect(setting.webEntry).toBe('site');
    expect(setting.deprecated).toBe(true);
    expect(setting.cacheSettingsName).toBe('cdn');
  });
});
