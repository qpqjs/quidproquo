import { QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';

export type ApplicationQPQConfigSetting = {
  applicationName: string;
  configRoot: string;
  environment?: string;
  feature?: string;
} & QPQConfigSetting;

export const defineApplication = (
  applicationName: string,
  environment: string,
  configRoot: string,
  feature?: string,
): ApplicationQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.appName,
  uniqueKey: applicationName,

  applicationName,
  configRoot,
  environment,
  feature,
});
