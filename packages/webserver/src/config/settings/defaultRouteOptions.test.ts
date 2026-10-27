import { describe, expect, it } from 'vitest';

import { QPQWebServerConfigSettingType } from '../QPQConfig';
import { defineDefaultRouteOptions } from './defaultRouteOptions';

describe('defineDefaultRouteOptions', () => {
  it('builds a DefaultRouteOptions setting keyed by group name', () => {
    const routeOptions = { allowedOrigins: ['https://example.com'] };

    expect(defineDefaultRouteOptions('public', routeOptions)).toEqual({
      configSettingType: QPQWebServerConfigSettingType.DefaultRouteOptions,
      uniqueKey: 'public',
      routeOptions,
    });
  });
});
