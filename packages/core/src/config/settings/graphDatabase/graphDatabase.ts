import { CrossModuleOwner } from '../../../types';
import { QPQConfigAdvancedSettings, QPQConfigSetting, QPQCoreConfigSettingType } from '../../QPQConfig';
import { convertCrossModuleOwnerToGenericResourceNameOverride } from '../../utils/crossModuleUtils';

export type QPQConfigAdvancedGraphDatabaseSettings = {
  owner?: CrossModuleOwner<'graphDatabaseName'>;
} & QPQConfigAdvancedSettings;

export type GraphDatabaseQPQConfigSetting = {
  name: string;
  virtualNetworkName: string;
} & QPQConfigSetting;

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
