import { QPQConfigSetting, QPQCoreConfigSettingType } from '../../QPQConfig';

export type ApiBuildPathQPQConfigSetting = {
  apiBuildPath: string;
} & QPQConfigSetting;

export const defineApiBuildPath = (apiBuildPath: string): ApiBuildPathQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.apiBuildPath,
  uniqueKey: apiBuildPath,

  apiBuildPath,
});
