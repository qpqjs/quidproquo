import { QPQConfigSetting, QPQCoreConfigSettingType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { QPQWebServerConfigSettingType } from '../../QPQConfig';
import { RouteQPQWebServerConfigSetting } from '../route';
import { defineAuthSystem } from './defineAuthSystem';

const routePaths = (settings: QPQConfigSetting[]): string[] =>
  settings.filter((s) => s.configSettingType === QPQWebServerConfigSettingType.Route).map((s) => (s as RouteQPQWebServerConfigSetting).path);

describe('defineAuthSystem', () => {
  it('declares the user directory at the top level and gates the routes behind the service', () => {
    const config = defineAuthSystem('auth', 'users');

    expect(config[0]).toMatchObject({ configSettingType: QPQCoreConfigSettingType.userDirectory, name: 'users' });
    expect(config[1]).toMatchObject({ configSettingType: QPQCoreConfigSettingType.serviceSettings });

    const serviceSettings = config[1] as unknown as { settingsByService: Record<string, QPQConfigSetting[]> };
    expect(routePaths(serviceSettings.settingsByService.auth)).toContain('/login');
  });

  it('prefixes every route with the supplied base path', () => {
    const config = defineAuthSystem('auth', 'users', { basePath: '/auth' });
    const serviceSettings = config[1] as unknown as { settingsByService: Record<string, QPQConfigSetting[]> };
    const paths = routePaths(serviceSettings.settingsByService.auth);

    expect(paths).toContain('/auth/login');
    expect(paths).toContain('/auth/changePassword');
    expect(paths.every((p) => p.startsWith('/auth/'))).toBe(true);
  });
});
