import { QPQConfig, QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';

export type ServiceSettingsQPQConfigSetting = {
  settingsByService: Record<string, QPQConfig>;
} & QPQConfigSetting;

export const defineServiceSettings = (settingsByService: Record<string, QPQConfig>): ServiceSettingsQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.serviceSettings,
  uniqueKey: Object.keys(settingsByService).sort().join(','),

  settingsByService,
});
