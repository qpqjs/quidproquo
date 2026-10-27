import { describe, expect, it } from 'vitest';

import { QPQCoreConfigSettingType } from '../QPQConfig';
import { defineEnvironmentSettings } from './environmentSettings';

describe('defineEnvironmentSettings', () => {
  it('builds an EnvironmentSettings setting keyed by the sorted environment names', () => {
    const settingsByEnvironment = { prod: [], dev: [] };

    expect(defineEnvironmentSettings(settingsByEnvironment)).toEqual({
      configSettingType: QPQCoreConfigSettingType.environmentSettings,
      uniqueKey: 'dev,prod',
      settingsByEnvironment,
    });
  });

  it('produces an empty unique key when there are no environments', () => {
    expect(defineEnvironmentSettings({}).uniqueKey).toBe('');
  });
});
