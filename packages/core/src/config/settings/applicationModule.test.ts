import { describe, expect, it } from 'vitest';

import { QPQCoreConfigSettingType } from '../QPQConfig';
import { defineApplicationModule } from './applicationModule';

describe('defineApplicationModule', () => {
  it('builds an application, module and apiBuildPath setting', () => {
    const config = defineApplicationModule('MyApp', 'MyModule', 'dev', './config', './build');

    expect(config).toEqual([
      {
        configSettingType: QPQCoreConfigSettingType.appName,
        uniqueKey: 'MyApp',
        applicationName: 'MyApp',
        configRoot: './config',
        environment: 'dev',
        feature: undefined,
      },
      {
        configSettingType: QPQCoreConfigSettingType.moduleName,
        uniqueKey: 'MyModule',
        moduleName: 'MyModule',
      },
      {
        configSettingType: QPQCoreConfigSettingType.apiBuildPath,
        uniqueKey: './build',
        apiBuildPath: './build',
      },
    ]);
  });

  it('passes the optional feature through to the application setting', () => {
    const [application] = defineApplicationModule('MyApp', 'MyModule', 'dev', './config', './build', 'beta');

    expect((application as any).feature).toBe('beta');
  });
});
