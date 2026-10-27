import { QPQConfigAdvancedSettings, QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';

export interface QPQConfigAdvancedVirtualNetworkSettings extends QPQConfigAdvancedSettings {}

export interface VirtualNetworkQPQConfigSetting extends QPQConfigSetting {
  name: string;
}

export const defineVirtualNetwork = (name: string, options?: QPQConfigAdvancedVirtualNetworkSettings): VirtualNetworkQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.virtualNetwork,
  uniqueKey: name,

  name,
});
