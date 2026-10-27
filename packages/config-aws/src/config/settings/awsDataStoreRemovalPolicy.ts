import { QPQConfigSetting } from 'quidproquo-core';

import { QPQAwsConfigSettingType } from '../QPQConfig';

export enum AwsDataStoreRemovalPolicy {
  retain = 'retain',
  destroy = 'destroy',
}

export interface AwsDataStoreRemovalPolicyQPQConfigSetting extends QPQConfigSetting {
  removalPolicy: AwsDataStoreRemovalPolicy;
}

/**
 * Removal policy for this service's data stores (storage-drive S3 buckets,
 * key-value-store DynamoDB tables, Cognito user pools, and Neptune graph DB
 * clusters — Neptune retains via a final snapshot rather than a live cluster).
 * Defaults to `retain` when not declared, so production data survives a
 * `cdk destroy` / resource replacement; declare `destroy` in dev configs to
 * keep full-teardown behaviour.
 */
export const defineAwsDataStoreRemovalPolicy = (removalPolicy: AwsDataStoreRemovalPolicy): AwsDataStoreRemovalPolicyQPQConfigSetting => ({
  configSettingType: QPQAwsConfigSettingType.awsDataStoreRemovalPolicy,
  uniqueKey: 'awsDataStoreRemovalPolicy',

  removalPolicy,
});
