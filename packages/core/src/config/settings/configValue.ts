import { QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';

export type ConfigValueQPQConfigSetting<T> = {
  configValueName: string;
  configValue: T;
} & QPQConfigSetting;

export const defineConfigValue = <T>(configValueName: string, configValue: T): ConfigValueQPQConfigSetting<T> => ({
  configSettingType: QPQCoreConfigSettingType.configValue,
  uniqueKey: configValueName,

  configValueName,
  configValue,
});
