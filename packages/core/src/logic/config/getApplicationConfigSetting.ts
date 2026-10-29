import { QPQConfig, QPQCoreConfigSettingType } from '../../config/QPQConfig';
import { ApplicationQPQConfigSetting } from '../../config/settings/applicationName';
import { getConfigSetting } from './getConfigSetting';

// The application setting every config must open with (defineApplication); throws when it is missing.
export const getApplicationConfigSetting = (qpqConfig: QPQConfig): ApplicationQPQConfigSetting => {
  const applicationModuleSetting = getConfigSetting<ApplicationQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.appName);

  if (!applicationModuleSetting) {
    throw new Error('please use defineApplication in your QPQ config');
  }

  return applicationModuleSetting;
};
