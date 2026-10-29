import { CustomFullyQualifiedResource, FullyQualifiedResource, QPQConfigAdvancedSettings, QPQConfigSetting, qpqCoreUtils } from '@qpqjs/core';

import { QPQAwsConfigSettingType } from '../QPQConfig';

export interface QPQConfigAdvancedAwsDynamoOverrideForKvsSettings extends QPQConfigAdvancedSettings {}

export interface AwsDynamoOverrideForKvsQPQConfigSetting extends QPQConfigSetting {
  name: string;

  kvsStore: FullyQualifiedResource;
  dynamoTableName: string;
  deprecated: boolean;
}

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
