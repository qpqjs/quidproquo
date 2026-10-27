import { describe, expect, it } from 'vitest';

import { QPQCoreConfigSettingType } from '../QPQConfig';
import { defineConfigValue } from './configValue';

describe('defineConfigValue', () => {
  it('builds a ConfigValue setting with the given name and value', () => {
    expect(defineConfigValue('maxItems', 10)).toEqual({
      configSettingType: QPQCoreConfigSettingType.configValue,
      uniqueKey: 'maxItems',
      configValueName: 'maxItems',
      configValue: 10,
    });
  });
});
