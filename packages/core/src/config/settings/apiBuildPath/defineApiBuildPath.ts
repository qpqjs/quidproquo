import { QPQConfigSetting, QPQCoreConfigSettingType } from '../../QPQConfig';

export interface ApiBuildPathQPQConfigSetting extends QPQConfigSetting {
  apiBuildPath: string;
}

export const defineApiBuildPath = (apiBuildPath: string): ApiBuildPathQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.apiBuildPath,
  uniqueKey: apiBuildPath,

  apiBuildPath,
});
