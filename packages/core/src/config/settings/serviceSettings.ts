import { QPQConfig, QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';

export interface ServiceSettingsQPQConfigSetting extends QPQConfigSetting {
  settingsByService: Record<string, QPQConfig>;
}

export const defineServiceSettings = (settingsByService: Record<string, QPQConfig>): ServiceSettingsQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.serviceSettings,
  uniqueKey: Object.keys(settingsByService).sort().join(','),

  settingsByService,
});
