import { QPQWebServerConfigSettingType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { defineAdminServiceLogRoute } from './defineAdminServiceLogRoute';

describe('defineAdminServiceLogRoute', () => {
  it('builds a Route setting targeting the logController method', () => {
    const route = defineAdminServiceLogRoute('GET', '/logs', 'getLogs');

    expect(route.configSettingType).toBe(QPQWebServerConfigSettingType.Route);
    expect(route.method).toBe('GET');
    expect(route.path).toBe('/logs');
    expect(route.runtime).toEqual({
      basePath: expect.any(String),
      relativePath: 'admin/log/entry/controller/logController',
      functionName: 'getLogs',
    });
    expect(route.uniqueKey).toContain('log/entry/controller/logController::getLogs');
  });

  it('defaults the apiKeys to an empty array when no options are given', () => {
    const route = defineAdminServiceLogRoute('POST', '/logs', 'toggleLogCheck');

    expect(route.options).toEqual({ routeAuthSettings: { apiKeys: [] } });
  });

  it('normalizes string apiKeys into references', () => {
    const route = defineAdminServiceLogRoute('GET', '/logs', 'getLogs', {
      routeAuthSettings: { apiKeys: ['primary'] },
    });

    expect(route.options.routeAuthSettings?.apiKeys).toEqual([{ name: 'primary' }]);
  });
});
