import { CustomFullyQualifiedResource } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { QPQAwsConfigSettingType } from '../QPQConfig';
import { defineAwsDynamoOverrideForKvs } from './awsDynamoOverrideForKvs';

describe('defineAwsDynamoOverrideForKvs', () => {
  it('builds an override and converts the kvs resource to a generic fully qualified resource', () => {
    expect(
      defineAwsDynamoOverrideForKvs(
        'override',
        { keyValueStoreName: 'users', module: 'auth' } as CustomFullyQualifiedResource<'keyValueStoreName'>,
        'users-table',
      ),
    ).toEqual({
      configSettingType: QPQAwsConfigSettingType.awsDynamoOverrideForKvs,
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
