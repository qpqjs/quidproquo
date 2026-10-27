import { QPQWebServerConfigSettingType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { defineAdminServiceLogLogRoute } from './defineAdminServiceLogLogRoute';

describe('defineAdminServiceLogLogRoute', () => {
  it('builds a Route setting targeting the logLogController method', () => {
    const route = defineAdminServiceLogLogRoute('GET', '/log-logs', 'getLogLogs');

    expect(route.configSettingType).toBe(QPQWebServerConfigSettingType.Route);
    expect(route.method).toBe('GET');
    expect(route.path).toBe('/log-logs');
    expect(route.runtime).toEqual({
      basePath: expect.any(String),
      relativePath: 'admin/log/entry/controller/logLogController',
      functionName: 'getLogLogs',
    });
    expect(route.uniqueKey).toContain('log/entry/controller/logLogController::getLogLogs');
  });

  it('defaults the apiKeys to an empty array when no options are given', () => {
    const route = defineAdminServiceLogLogRoute('GET', '/log-logs', 'getLogLogs');

    expect(route.options).toEqual({ routeAuthSettings: { apiKeys: [] } });
  });
});
