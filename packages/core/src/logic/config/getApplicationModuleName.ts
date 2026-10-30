import { QPQConfig, QPQCoreConfigSettingType } from '../../config/QPQConfig';
import { ModuleQPQConfigSetting } from '../../config/settings/moduleName';
import { getConfigSetting } from './getConfigSetting';

// The module (service) this config is for (defineModule); throws when it is missing.
export const getApplicationModuleName = (qpqConfig: QPQConfig): string => {
  const moduleSetting = getConfigSetting<ModuleQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.moduleName);

  if (!moduleSetting) {
    throw new Error('please use defineModule in your QPQ config');
  }

  return moduleSetting.moduleName;
};
