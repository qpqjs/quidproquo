import { QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';

export interface ConfigValueQPQConfigSetting<T> extends QPQConfigSetting {
  configValueName: string;
  configValue: T;
}

export const defineConfigValue = <T>(configValueName: string, configValue: T): ConfigValueQPQConfigSetting<T> => ({
  configSettingType: QPQCoreConfigSettingType.configValue,
  uniqueKey: configValueName,

  configValueName,
  configValue,
});
