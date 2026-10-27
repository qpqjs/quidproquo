import { QPQConfig, QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';
import { defineApiBuildPath } from './apiBuildPath';
import { defineApplication } from './applicationName';
import { defineModule } from './moduleName';

export interface ApplicationModuleQPQConfigSetting extends QPQConfigSetting {
  // Noop
}

export const defineApplicationModule = (
  applicationName: string,
  moduleName: string,
  environment: string,
  configRoot: string,
  apiBuildPath: string,
  feature?: string,
): QPQConfig => [
  // App
  defineApplication(applicationName, environment, configRoot, feature),

  // Module
  defineModule(moduleName),

  // Buildpath
  defineApiBuildPath(apiBuildPath),
];
