import { QPQConfig, QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';

export interface EnvironmentSettingsQPQConfigSetting extends QPQConfigSetting {
  settingsByEnvironment: Record<string, QPQConfig>;
}

export const defineEnvironmentSettings = (settingsByEnvironment: Record<string, QPQConfig>): EnvironmentSettingsQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.environmentSettings,
  uniqueKey: Object.keys(settingsByEnvironment).sort().join(','),

  settingsByEnvironment,
});
