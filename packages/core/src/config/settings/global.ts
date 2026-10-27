import { QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';

export interface GlobalQPQConfigSetting<T> extends QPQConfigSetting {
  key: string;
  value: T;
}

export const defineGlobal = <T>(key: string, value: T): GlobalQPQConfigSetting<T> => ({
  configSettingType: QPQCoreConfigSettingType.global,
  uniqueKey: key,

  key,
  value,
});
