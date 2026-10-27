import {
  CrossModuleOwner,
  CustomFullyQualifiedResource,
  FullyQualifiedResource,
  QPQConfigAdvancedSettings,
  QPQConfigSetting,
  qpqCoreUtils,
} from 'quidproquo-core';

import { QPQAwsConfigSettingType } from '../QPQConfig';

export interface QPQConfigAdvancedAwsDyanmoOverrideForKvsSettings extends QPQConfigAdvancedSettings {}

export interface AwsDyanmoOverrideForKvsQPQConfigSetting extends QPQConfigSetting {
  name: string;

  kvsStore: FullyQualifiedResource;
  dynamoTableName: string;
}

export const defineAwsDyanmoOverrideForKvs = (
  name: string,
  kvsStore: CustomFullyQualifiedResource<'keyValueStoreName'>,
  dynamoTableName: string,
  options?: QPQConfigAdvancedAwsDyanmoOverrideForKvsSettings,
): AwsDyanmoOverrideForKvsQPQConfigSetting => ({
  configSettingType: QPQAwsConfigSettingType.awsDyanmoOverrideForKvs,
  uniqueKey: name,

  name,

  kvsStore: qpqCoreUtils.convertCustomFullyQualifiedResourceToGeneric(kvsStore),
  dynamoTableName,
});
