import { QPQConfig, QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';

export type EnvironmentSettingsQPQConfigSetting = {
  settingsByEnvironment: Record<string, QPQConfig>;
} & QPQConfigSetting;

export const defineEnvironmentSettings = (settingsByEnvironment: Record<string, QPQConfig>): EnvironmentSettingsQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.environmentSettings,
  uniqueKey: Object.keys(settingsByEnvironment).sort().join(','),

  settingsByEnvironment,
});
