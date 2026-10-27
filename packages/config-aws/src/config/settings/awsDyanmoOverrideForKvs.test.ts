import { CustomFullyQualifiedResource } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { QPQAwsConfigSettingType } from '../QPQConfig';
import { defineAwsDyanmoOverrideForKvs } from './awsDyanmoOverrideForKvs';

describe('defineAwsDyanmoOverrideForKvs', () => {
  it('builds an override and converts the kvs resource to a generic fully qualified resource', () => {
    expect(
      defineAwsDyanmoOverrideForKvs(
        'override',
        { keyValueStoreName: 'users', module: 'auth' } as CustomFullyQualifiedResource<'keyValueStoreName'>,
        'users-table',
      ),
    ).toEqual({
      configSettingType: QPQAwsConfigSettingType.awsDyanmoOverrideForKvs,
      uniqueKey: 'override',
      name: 'override',
      kvsStore: {
        module: 'auth',
        application: undefined,
        feature: undefined,
        environment: undefined,
        resourceName: 'users',
      },
      dynamoTableName: 'users-table',
    });
  });
});
