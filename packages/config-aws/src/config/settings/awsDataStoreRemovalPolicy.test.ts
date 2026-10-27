import { describe, expect, it } from 'vitest';

import { QPQAwsConfigSettingType } from '../QPQConfig';
import { AwsDataStoreRemovalPolicy, defineAwsDataStoreRemovalPolicy } from './awsDataStoreRemovalPolicy';

describe('defineAwsDataStoreRemovalPolicy', () => {
  it('builds a data store removal policy setting', () => {
    expect(defineAwsDataStoreRemovalPolicy(AwsDataStoreRemovalPolicy.destroy)).toEqual({
      configSettingType: QPQAwsConfigSettingType.awsDataStoreRemovalPolicy,
      uniqueKey: 'awsDataStoreRemovalPolicy',
      removalPolicy: AwsDataStoreRemovalPolicy.destroy,
    });
  });
});
