import { describe, expect, it } from 'vitest';

import { QPQCoreConfigSettingType } from '../QPQConfig';
import { defineApplication } from './applicationName';

describe('defineApplication', () => {
  it('builds an application setting with the given fields', () => {
    expect(defineApplication('MyApp', 'dev', './config')).toEqual({
      configSettingType: QPQCoreConfigSettingType.appName,
      uniqueKey: 'MyApp',
      applicationName: 'MyApp',
      configRoot: './config',
      environment: 'dev',
      feature: undefined,
    });
  });

  it('passes the optional feature through', () => {
    expect(defineApplication('MyApp', 'dev', './config', 'beta').feature).toBe('beta');
  });
});
