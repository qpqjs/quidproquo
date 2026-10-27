import { QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';

export interface ModuleQPQConfigSetting extends QPQConfigSetting {
  moduleName: string;
}

export const defineModule = (moduleName: string): ModuleQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.moduleName,
  uniqueKey: moduleName,

  moduleName,
});
