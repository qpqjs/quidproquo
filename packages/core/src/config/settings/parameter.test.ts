import { describe, expect, it } from 'vitest';

import { QPQCoreConfigSettingType } from '../QPQConfig';
import { defineParameter } from './parameter';

describe('defineParameter', () => {
  it('builds a Parameter setting with the given key and defaults value to an empty string', () => {
    expect(defineParameter('region')).toEqual({
      configSettingType: QPQCoreConfigSettingType.parameter,
      uniqueKey: 'region',
      key: 'region',
      value: '',
      owner: undefined,
    });
  });

  it('uses the supplied value', () => {
    expect(defineParameter('region', { value: 'us-east-1' }).value).toBe('us-east-1');
  });

  it('converts the owner to a resourceNameOverride', () => {
    expect(defineParameter('region', { owner: { module: 'other', parameterName: 'region' } }).owner).toEqual({
      module: 'other',
      parameterName: 'region',
      resourceNameOverride: 'region',
    });
  });
});
