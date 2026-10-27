import { describe, expect, it } from 'vitest';

import { QPQAwsConfigSettingType } from '../../QPQConfig';
import { defineWafProtection } from './defineWafProtection';

describe('defineWafProtection', () => {
  it('builds a waf protection setting', () => {
    expect(defineWafProtection()).toEqual({
      configSettingType: QPQAwsConfigSettingType.wafProtection,
      uniqueKey: 'wafProtection',
    });
  });
});
