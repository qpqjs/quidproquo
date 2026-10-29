import { CrossModuleOwner } from '../../../types';
import { QPQConfigAdvancedSettings, QPQConfigSetting, QPQCoreConfigSettingType } from '../../QPQConfig';
import { convertCrossModuleOwnerToGenericResourceNameOverride } from '../../utils/crossModuleUtils';

export interface QPQConfigAdvancedGraphDatabaseSettings extends QPQConfigAdvancedSettings {
  owner?: CrossModuleOwner<'graphDatabaseName'>;
}

export interface GraphDatabaseQPQConfigSetting extends QPQConfigSetting {
  name: string;
  virtualNetworkName: string;
}

export const defineGraphDatabase = (
  name: string,
  virtualNetworkName: string,
  options?: QPQConfigAdvancedGraphDatabaseSettings,
): GraphDatabaseQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.graphDatabase,
  uniqueKey: name,

  name,
  virtualNetworkName,

  owner: convertCrossModuleOwnerToGenericResourceNameOverride(options?.owner),
});
