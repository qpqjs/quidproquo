import { QPQWebServerConfigSettingType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { defineAdminServiceAuthRoute } from './defineAdminServiceAuthRoute';

describe('defineAdminServiceAuthRoute', () => {
  it('builds a Route setting targeting the loginController method', () => {
    const route = defineAdminServiceAuthRoute('POST', '/login', 'login');

    expect(route.configSettingType).toBe(QPQWebServerConfigSettingType.Route);
    expect(route.method).toBe('POST');
    expect(route.path).toBe('/login');
    expect(route.runtime).toEqual({
      basePath: expect.any(String),
      relativePath: 'admin/log/entry/controller/loginController',
      functionName: 'login',
    });
    expect(route.uniqueKey).toContain('log/entry/controller/loginController::login');
  });

  it('defaults the apiKeys to an empty array when no options are given', () => {
    const route = defineAdminServiceAuthRoute('POST', '/login', 'login');

    expect(route.options).toEqual({ routeAuthSettings: { apiKeys: [] } });
  });
});
