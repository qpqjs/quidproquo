import { CustomFullyQualifiedResource, FullyQualifiedResource, QPQConfigAdvancedSettings, QPQConfigSetting, qpqCoreUtils } from '@qpqjs/core';

import { QPQAwsConfigSettingType } from '../QPQConfig';

export type QPQConfigAdvancedAwsDynamoOverrideForKvsSettings = {} & QPQConfigAdvancedSettings;

export type AwsDynamoOverrideForKvsQPQConfigSetting = {
  name: string;

  kvsStore: FullyQualifiedResource;
  dynamoTableName: string;
  deprecated: boolean;
} & QPQConfigSetting;

export const defineAwsDynamoOverrideForKvs = (
  name: string,
  kvsStore: CustomFullyQualifiedResource<'keyValueStoreName'>,
  dynamoTableName: string,
  options?: QPQConfigAdvancedAwsDynamoOverrideForKvsSettings,
): AwsDynamoOverrideForKvsQPQConfigSetting => ({
  configSettingType: QPQAwsConfigSettingType.awsDynamoOverrideForKvs,
  uniqueKey: name,

  name,

  kvsStore: qpqCoreUtils.convertCustomFullyQualifiedResourceToGeneric(kvsStore),
  dynamoTableName,
  deprecated: options?.deprecated ?? false,
});
