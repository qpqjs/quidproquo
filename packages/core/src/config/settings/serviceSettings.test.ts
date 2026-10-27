import { describe, expect, it } from 'vitest';

import { QPQCoreConfigSettingType } from '../QPQConfig';
import { defineServiceSettings } from './serviceSettings';

describe('defineServiceSettings', () => {
  it('builds a ServiceSettings setting keyed by the sorted service names', () => {
    const settingsByService = { web: [], api: [] };

    expect(defineServiceSettings(settingsByService)).toEqual({
      configSettingType: QPQCoreConfigSettingType.serviceSettings,
      uniqueKey: 'api,web',
      settingsByService,
    });
  });
});
