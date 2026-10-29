import { QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';

export type GlobalQPQConfigSetting<T> = {
  key: string;
  value: T;
} & QPQConfigSetting;

export const defineGlobal = <T>(key: string, value: T): GlobalQPQConfigSetting<T> => ({
  configSettingType: QPQCoreConfigSettingType.global,
  uniqueKey: key,

  key,
  value,
});
