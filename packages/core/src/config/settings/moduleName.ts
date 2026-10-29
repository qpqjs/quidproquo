import { QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';

export type ModuleQPQConfigSetting = {
  moduleName: string;
} & QPQConfigSetting;

export const defineModule = (moduleName: string): ModuleQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.moduleName,
  uniqueKey: moduleName,

  moduleName,
});
