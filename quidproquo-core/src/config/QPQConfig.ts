import { CrossModuleOwner } from '../types';

export enum QPQCoreConfigSettingType {
  ai = '@quidproquo-core/config/Ai',
  appName = '@quidproquo-core/config/AppName',
  moduleName = '@quidproquo-core/config/moduleName',
  storageDrive = '@quidproquo-core/config/storageDrive',
  schedule = '@quidproquo-core/config/schedule',
  secret = '@quidproquo-core/config/secret',
  global = '@quidproquo-core/config/global',
  parameter = '@quidproquo-core/config/parameter',
  actionProcessors = '@quidproquo-core/config/actionProcessors',
  apiBuildPath = '@quidproquo-core/config/apiBuildPath',
  backendBundleOptions = '@quidproquo-core/config/BackendBundleOptions',
  frontendBundleOptions = '@quidproquo-core/config/FrontendBundleOptions',
  queue = '@quidproquo-core/config/Queue',
  eventBus = '@quidproquo-core/config/EventBus',
  userDirectory = '@quidproquo-core/config/UserDirectory',
  keyValueStore = '@quidproquo-core/config/KeyValueStore',
  configValue = '@quidproquo-core/config/ConfigValue',
  cryptoKey = '@quidproquo-core/config/cryptoKey',
  signingKey = '@quidproquo-core/config/signingKey',
  environmentSettings = '@quidproquo-core/config/EnvironmentSettings',
  serviceSettings = '@quidproquo-core/config/ServiceSettings',
  deployEvent = '@quidproquo-core/config/DeployEvent',
  graphDatabase = '@quidproquo-core/config/GraphDatabase',
  virtualNetwork = '@quidproquo-core/config/VirtualNetwork',
  notifyError = '@quidproquo-core/config/notifyError',
  inlineFunction = '@quidproquo-core/config/InlineFunction',
  dynamicFunctions = '@quidproquo-core/config/DynamicFunctions',
  javascriptRuntime = '@quidproquo-core/config/JavascriptRuntime',
  federatedModuleStore = '@quidproquo-core/config/FederatedModuleStore',
}

export interface QPQConfigSetting {
  configSettingType: string;
  uniqueKey: string;

  owner?: CrossModuleOwner;
}

export interface QPQConfigAdvancedSettings {
  deprecated?: boolean;
}

export type QPQConfigItem = QPQConfigSetting | QPQConfigItem[];
export type QPQConfig = QPQConfigItem[];
