import { QPQConfigAdvancedSettings, QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';

export type QPQConfigAdvancedVirtualNetworkSettings = {} & QPQConfigAdvancedSettings;

export type VirtualNetworkQPQConfigSetting = {
  name: string;
  deprecated: boolean;
} & QPQConfigSetting;

export const defineVirtualNetwork = (name: string, options?: QPQConfigAdvancedVirtualNetworkSettings): VirtualNetworkQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.virtualNetwork,
  uniqueKey: name,

  name,
  deprecated: options?.deprecated ?? false,
});
