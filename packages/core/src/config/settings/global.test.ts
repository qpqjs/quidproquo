import { describe, expect, it } from 'vitest';

import { QPQCoreConfigSettingType } from '../QPQConfig';
import { defineGlobal } from './global';

describe('defineGlobal', () => {
  it('builds a Global setting with the given key and value', () => {
    expect(defineGlobal('region', 'us-east-1')).toEqual({
      configSettingType: QPQCoreConfigSettingType.global,
      uniqueKey: 'region',
      key: 'region',
      value: 'us-east-1',
    });
  });
});
