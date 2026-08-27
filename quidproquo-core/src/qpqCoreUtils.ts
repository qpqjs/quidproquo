import {
  ActionProcessorsQPQConfigSetting,
  AiQPQConfigSetting,
  ApiBuildPathQPQConfigSetting,
  ApplicationQPQConfigSetting,
  BackendBundleOptions,
  BackendBundleOptionsQPQConfigSetting,
  CryptoKeyQPQConfigSetting,
  defineJavascriptRuntime,
  DeployEventsQPQConfigSetting,
  DynamicFunctionsQPQConfigSetting,
  EmailTemplates,
  EnvironmentSettingsQPQConfigSetting,
  EventBusQPQConfigSetting,
  FederatedModuleStoreQPQConfigSetting,
  FrontendBundleOptions,
  FrontendBundleOptionsQPQConfigSetting,
  GlobalQPQConfigSetting,
  GraphDatabaseQPQConfigSetting,
  InlineFunctionQPQConfigSetting,
  JavascriptRuntimeQPQConfigSetting,
  KeyValueStoreQPQConfigSetting,
  ModuleQPQConfigSetting,
  NotifyErrorQPQConfigSetting,
  ParameterQPQConfigSetting,
  QPQConfig,
  QPQConfigItem,
  QPQConfigSetting,
  QPQCoreConfigSettingType,
  QpqQueueProcessors,
  QueueQPQConfigSetting,
  ScheduleQPQConfigSetting,
  SecretQPQConfigSetting,
  ServiceSettingsQPQConfigSetting,
  StorageDriveQPQConfigSetting,
  UserDirectoryQPQConfigSetting,
  VirtualNetworkQPQConfigSetting,
} from './config';
import {
  ConfigUrl,
  CrossModuleOwner,
  CrossServiceResourceName,
  CustomFullyQualifiedResource,
  FullyQualifiedResource,
  KeyOf,
  QpqFunctionRuntime,
  ResourceName,
} from './types';
import { isQpqFunctionRuntimeAdvanced } from './utils';

/**
 * Flattens a QPQConfig array into a single array of QPQConfigSetting objects.
 * If a QPQConfigItem has a configSettingType of QPQCoreConfigSettingType.environmentSettings,
 * and its environment matches the current environment, its settings will be added to the flattened array.
 * @function
 * @param {QPQConfig} qpqConfig - The input QPQConfig array to be flattened.
 * @returns {QPQConfigSetting[]} - The flattened array of QPQConfigSetting objects
 */
export const flattenQpqConfig = (qpqConfig: QPQConfig): QPQConfigSetting[] => {
  let environment = 'development';
  let service: string | undefined;

  /**
   * A recursive helper function that flattens an array of QPQConfigItem objects.
   * @function
   * @param {QPQConfigItem[]} configItems - An array of QPQConfigItem objects to be flattened.
   * @param {QPQConfigSetting[]} accumulator - An accumulator array for storing the flattened QPQConfigSetting objects.
   * @returns {QPQConfigSetting[]} - The flattened array of QPQConfigSetting objects.
   */
  const flatten = (configItems: QPQConfigItem[], accumulator: QPQConfigSetting[] = []): QPQConfigSetting[] => {
    return configItems.reduce<QPQConfigSetting[]>((acc, item) => {
      if (Array.isArray(item)) {
        return flatten(item, acc);
      } else {
        // If its a appName config item, update the environment variable
        if (item.configSettingType === QPQCoreConfigSettingType.appName) {
          environment = (item as ApplicationQPQConfigSetting).environment || 'development';
        }

        // If its a moduleName config item, update the service variable
        else if (item.configSettingType === QPQCoreConfigSettingType.moduleName) {
          service = (item as ModuleQPQConfigSetting).moduleName;
        }

        // Otherwise if its an environmentSettings config item, flatten out the child settings
        // for the current environment, falling back to the '*' key if present.
        else if (item.configSettingType === QPQCoreConfigSettingType.environmentSettings) {
          const envSetting = item as EnvironmentSettingsQPQConfigSetting;
          const settings = envSetting.settingsByEnvironment[environment] ?? envSetting.settingsByEnvironment['*'] ?? [];

          return flatten(settings, acc);
        }

        // Otherwise if its a serviceSettings config item, flatten out the child settings
        // for the current service, falling back to the '*' key if present.
        else if (item.configSettingType === QPQCoreConfigSettingType.serviceSettings) {
          if (!service) {
            throw new Error('defineServiceSettings requires a module to be set first via defineModule (usually through defineApplicationModule)');
          }

          const svcSetting = item as ServiceSettingsQPQConfigSetting;
          const settings = svcSetting.settingsByService[service] ?? svcSetting.settingsByService['*'] ?? [];

          return flatten(settings, acc);
        }

        // Otherwise its just a regular config item, add it to the list
        return [...acc, item];
      }
    }, accumulator);
  };

  return flatten(qpqConfig);
};

/**
 * Filters and returns the config settings of a specific type from a QPQConfig array.
 * @function
 * @template T - The specific type of QPQConfigSetting to filter.
 * @param {QPQConfig} qpqConfig - The input QPQConfig array.
 * @param {string} configSettingType - The specific config setting type to filter.
 * @returns {T[]} - An array of filtered config settings of the specified type.
 */
export const getConfigSettings = <T extends QPQConfigSetting>(qpqConfig: QPQConfig, configSettingType: string): T[] => {
  const flatConfig = flattenQpqConfig(qpqConfig);
  return flatConfig.filter((c) => c.configSettingType === configSettingType) as T[];
};

/**
 * Retrieves a single config setting of a specific type from a QPQConfig array.
 * @function
 * @template T - The specific type of QPQConfigSetting to retrieve.
 * @param {QPQConfig} qpqConfig - The input QPQConfig array.
 * @param {string} serviceInfrastructureConfigType - The specific config setting type to retrieve.
 * @returns {T | undefined} - The found config setting of the specified type or undefined if not found.
 */
export const getConfigSetting = <T extends QPQConfigSetting>(qpqConfig: QPQConfig, serviceInfrastructureConfigType: string): T | undefined => {
  const [setting] = getConfigSettings<T>(qpqConfig, serviceInfrastructureConfigType);
  return setting;
};

/**
 * Retrieves the ApplicationModuleSetting from a QPQConfig array.
 * @function
 * @param {QPQConfig} qpqConfig - The input QPQConfig array.
 * @returns {ApplicationQPQConfigSetting} - The ApplicationQPQConfigSetting from the QPQConfig array.
 * @throws {Error} - If the ApplicationQPQConfigSetting is not found in the QPQConfig array.
 */
export const getApplicationConfigSetting = (qpqConfig: QPQConfig): ApplicationQPQConfigSetting => {
  const applicationModuleSetting = getConfigSetting<ApplicationQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.appName);

  if (!applicationModuleSetting) {
    throw new Error('please use defineApplication in your QPQ config');
  }

  return applicationModuleSetting;
};

export const getApplicationModuleName = (qpqConfig: QPQConfig): string => {
  const moduleSetting = getConfigSetting<ModuleQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.moduleName);

  if (!moduleSetting) {
    throw new Error('please use defineModule in your QPQ config');
  }

  return moduleSetting.moduleName;
};

export const getApplicationConfigRoot = (qpqConfig: QPQConfig): string => {
  const moduleSetting = getConfigSetting<ApplicationQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.appName);

  if (!moduleSetting) {
    throw new Error('please use defineApplication in your QPQ config');
  }

  return moduleSetting.configRoot;
};

export const getApplicationName = (qpqConfig: QPQConfig): string => {
  return getApplicationConfigSetting(qpqConfig).applicationName;
};

export const getApplicationModuleFeature = (qpqConfig: QPQConfig): string | undefined => {
  return getApplicationConfigSetting(qpqConfig).feature;
};

export const getConfigRoot = (qpqConfig: QPQConfig): string => {
  return getApplicationConfigSetting(qpqConfig).configRoot;
};

export const getApplicationModuleEnvironment = (qpqConfig: QPQConfig): string => {
  return getApplicationConfigSetting(qpqConfig).environment || 'production';
};

export const getStorageDrives = (configs: QPQConfig): StorageDriveQPQConfigSetting[] => {
  return getConfigSettings<StorageDriveQPQConfigSetting>(configs, QPQCoreConfigSettingType.storageDrive);
};

export const getStorageDriveByName = (storageDriveName: string, configs: QPQConfig): StorageDriveQPQConfigSetting | undefined => {
  return getStorageDrives(configs).find((sd) => sd.storageDrive === storageDriveName);
};

export const getFederatedModuleStore = (qpqConfig: QPQConfig): FederatedModuleStoreQPQConfigSetting | undefined => {
  return getConfigSetting<FederatedModuleStoreQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.federatedModuleStore);
};

export const getQueues = (configs: QPQConfig): QueueQPQConfigSetting[] => {
  return getConfigSettings<QueueQPQConfigSetting>(configs, QPQCoreConfigSettingType.queue);
};

export const getOwnedQueues = (configs: QPQConfig): QueueQPQConfigSetting[] => {
  return getOwnedItems(getQueues(configs), configs);
};

export const getNotifyErrorConfigs = (configs: QPQConfig): NotifyErrorQPQConfigSetting[] => {
  return getConfigSettings<NotifyErrorQPQConfigSetting>(configs, QPQCoreConfigSettingType.notifyError);
};

export const getQueueByName = (configs: QPQConfig, name: string): QueueQPQConfigSetting | undefined => {
  return getQueues(configs).find((q) => q.name === name);
};

// A FIFO queue can only be fed by a FIFO event bus - standard SNS topics cannot deliver
// to FIFO SQS queues at all. Called at deploy/startup time (the queue and bus are separate
// settings, so defineQueue can't validate this on its own).
export const assertFifoQueueEventBusSubscriptionsAreValid = (qpqConfig: QPQConfig): void => {
  const invalidSubscriptions = getQueues(qpqConfig)
    .filter((queue) => queue.isFifo)
    .flatMap((queue) =>
      queue.eventBusSubscriptions
        .filter((eventBusName) => !getEventBusConfigByName(eventBusName, qpqConfig)?.isFifo)
        .map((eventBusName) => `queue [${queue.name}] -> event bus [${eventBusName}]`),
    );

  if (invalidSubscriptions.length > 0) {
    throw new Error(
      `FIFO queues can only subscribe to FIFO event buses (standard SNS topics cannot deliver to FIFO SQS queues): ${invalidSubscriptions.join(', ')}`,
    );
  }
};

export const getStorageDriveNames = (configs: QPQConfig): string[] => {
  const storageDriveNames = getConfigSettings<StorageDriveQPQConfigSetting>(configs, QPQCoreConfigSettingType.storageDrive).map(
    (sd) => sd.storageDrive,
  );

  return storageDriveNames;
};

export const getAllEventBusConfigs = (qpqConfig: QPQConfig): EventBusQPQConfigSetting[] => {
  const eventBuses = getConfigSettings<EventBusQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.eventBus);

  return eventBuses;
};

export const getAllAiConfigs = (qpqConfig: QPQConfig): AiQPQConfigSetting[] => {
  return getConfigSettings<AiQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.ai);
};

// Always resolves - falls back to the defineJavascriptRuntime defaults when no setting is present
export const getJavascriptRuntimeConfig = (qpqConfig: QPQConfig): JavascriptRuntimeQPQConfigSetting => {
  return getConfigSetting<JavascriptRuntimeQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.javascriptRuntime) ?? defineJavascriptRuntime();
};

export const getOwnedEventBusConfigs = (qpqConfig: QPQConfig): EventBusQPQConfigSetting[] => {
  const ownedEventBusConfigs = getOwnedItems(getAllEventBusConfigs(qpqConfig), qpqConfig);

  return ownedEventBusConfigs;
};

export const getEventBusConfigByName = (eventBusName: string, qpqConfig: QPQConfig): EventBusQPQConfigSetting | undefined => {
  const allConfigs = getAllEventBusConfigs(qpqConfig);

  const eventBusConfig = allConfigs.find((eb) => eb.owner?.resourceNameOverride === eventBusName);

  if (eventBusConfig) {
    return eventBusConfig;
  }

  return allConfigs.find((eb) => eb.name === eventBusName);
};

export const getOwnedItems = <T extends QPQConfigSetting>(settings: T[], qpqConfig: QPQConfig): T[] => {
  const appModuleName = getApplicationModuleName(qpqConfig);
  const appName = getApplicationName(qpqConfig);
  const appFeature = getApplicationModuleFeature(qpqConfig);
  const appEnvironment = getApplicationModuleEnvironment(qpqConfig);

  return settings.filter(
    (s) =>
      !s.owner ||
      ((!s.owner.module || s.owner.module === appModuleName) &&
        (!s.owner.application || s.owner.application === appName) &&
        (s.owner.feature === undefined || (!s.owner.feature && !appFeature) || s.owner.feature === appFeature) &&
        (!s.owner.environment || s.owner.environment === appEnvironment)),
  );
};

export const getAllKeyValueStores = <T extends object = any>(qpqConfig: QPQConfig): KeyValueStoreQPQConfigSetting<T>[] => {
  const keyValueStores = getConfigSettings<KeyValueStoreQPQConfigSetting<T>>(qpqConfig, QPQCoreConfigSettingType.keyValueStore);

  return keyValueStores;
};

export const getAllGraphDatabaseConfigs = (qpqConfig: QPQConfig): GraphDatabaseQPQConfigSetting[] => {
  const graphDatabases = getConfigSettings<GraphDatabaseQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.graphDatabase);

  return graphDatabases;
};

export const getDeployEventConfigs = (qpqConfig: QPQConfig): DeployEventsQPQConfigSetting[] => {
  const deployEvents = getConfigSettings<DeployEventsQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.deployEvent);

  return deployEvents;
};

export const getVirualNetworkConfigs = (qpqConfig: QPQConfig): VirtualNetworkQPQConfigSetting[] => {
  return getConfigSettings<VirtualNetworkQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.virtualNetwork);
};

export const getOwnedKeyValueStores = <T extends object = any>(qpqConfig: QPQConfig): KeyValueStoreQPQConfigSetting<T>[] => {
  return getOwnedItems(getAllKeyValueStores(qpqConfig), qpqConfig);
};

export const getOwnedGraphDatabases = (qpqConfig: QPQConfig): GraphDatabaseQPQConfigSetting[] => {
  return getOwnedItems(getAllGraphDatabaseConfigs(qpqConfig), qpqConfig);
};

export const getOwnedStorageDrives = (qpqConfig: QPQConfig): StorageDriveQPQConfigSetting[] => {
  return getOwnedItems(getStorageDrives(qpqConfig), qpqConfig);
};

export const resolveCrossServiceResourceName = (resourceName: ResourceName): CrossServiceResourceName => {
  if (typeof resourceName === 'string') {
    return {
      name: resourceName,
    };
  }

  return resourceName;
};

export const getKeyValueStoreByName = <T extends object = any>(
  qpqConfig: QPQConfig,
  kvsName: string,
): KeyValueStoreQPQConfigSetting<T> | undefined => {
  const keyValueStore = getAllKeyValueStores<T>(qpqConfig).find((kvs) => kvs.keyValueStoreName === kvsName);

  return keyValueStore;
};

export const getActionProcessorSources = (configs: QPQConfig): QpqFunctionRuntime[] => {
  const sources = getConfigSettings<ActionProcessorsQPQConfigSetting>(configs, QPQCoreConfigSettingType.actionProcessors).map((ap) => ap.runtime);

  return sources;
};

export const getUserDirectoryEmailTemplates = (qpqConfig: QPQConfig): Record<string, EmailTemplates> => {
  const userDirectories = getConfigSettings<UserDirectoryQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.userDirectory);

  const record = userDirectories.reduce(
    (acc, ud) => ({
      ...acc,
      [ud.name]: ud.emailTemplates,
    }),
    {} as Record<string, EmailTemplates>,
  );

  return record;
};

export const getScheduleEvents = (configs: QPQConfig): ScheduleQPQConfigSetting[] => {
  return getConfigSettings<ScheduleQPQConfigSetting>(configs, QPQCoreConfigSettingType.schedule);
};

export const getOwnedScheduleEvents = (qpqConfig: QPQConfig): ScheduleQPQConfigSetting[] => {
  return getOwnedItems(getScheduleEvents(qpqConfig), qpqConfig);
};

export const getQueueSrcEntries = (configs: QPQConfig): QpqFunctionRuntime[] => {
  const queueConfigs = getConfigSettings<QueueQPQConfigSetting>(configs, QPQCoreConfigSettingType.queue);

  return queueConfigs.reduce((acc, qc) => [...acc, ...Object.values(qc.qpqQueueProcessors)], [] as QpqFunctionRuntime[]);
};

export const getUserDirectorySrcEntries = (qpqConfig: QPQConfig): QpqFunctionRuntime[] => {
  // We just want the ones this service owns.
  const userConfigs = getOwnedUserDirectories(qpqConfig);

  return userConfigs
    .reduce((acc, ud) => [...acc, ...Object.values(ud.emailTemplates), ...Object.values(ud.customAuthRuntime || {})], [] as QpqFunctionRuntime[])
    .filter((se) => !!se);
};

export const getAllInlineFunctions = (qpqConfig: QPQConfig): InlineFunctionQPQConfigSetting[] => {
  return getConfigSettings<InlineFunctionQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.inlineFunction);
};

export const getOwnedInlineFunctions = (qpqConfig: QPQConfig): InlineFunctionQPQConfigSetting[] => {
  return getOwnedItems(getAllInlineFunctions(qpqConfig), qpqConfig);
};

export const getAllDynamicFunctions = (qpqConfig: QPQConfig): DynamicFunctionsQPQConfigSetting[] => {
  return getConfigSettings<DynamicFunctionsQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.dynamicFunctions);
};

export const getOwnedDynamicFunctions = (qpqConfig: QPQConfig): DynamicFunctionsQPQConfigSetting[] => {
  return getOwnedItems(getAllDynamicFunctions(qpqConfig), qpqConfig);
};

// Runtime-attached action processor override sources must join the bundler sweep,
// or the deployed bundle omits them and the dynamic load fails at runtime.
export const expandSrcEntriesWithActionProcessors = (runtimes: QpqFunctionRuntime[]): QpqFunctionRuntime[] => {
  return runtimes.flatMap((runtime) => [runtime, ...((isQpqFunctionRuntimeAdvanced(runtime) && runtime.actionProcessors) || [])]);
};

// Used in bundlers to know where and what to build and index
export const getAllSrcEntries = (qpqConfig: QPQConfig): QpqFunctionRuntime[] => {
  const result = [
    ...getActionProcessorSources(qpqConfig),
    ...getScheduleEvents(qpqConfig).map((r) => r.runtime),
    ...getQueueSrcEntries(qpqConfig),
    ...getUserDirectorySrcEntries(qpqConfig),
    ...getDeployEventConfigs(qpqConfig).map((r) => r.runtime),
    ...getStorageDrives(qpqConfig).flatMap((sd) => [sd.onEvent?.create, sd.onEvent?.delete].filter((r) => !!r) as QpqFunctionRuntime[]),
    // A store's change-stream handler. Missing here, the bundler never sees it: the lambda
    // zip omits it and the dev server's dynamic loader has nothing to resolve, so the handler
    // simply never runs — and since nothing throws, the only symptom is a projection that
    // silently stops updating.
    ...(getAllKeyValueStores(qpqConfig)
      .map((kvs) => kvs.onStream?.runtime)
      .filter((runtime) => !!runtime) as QpqFunctionRuntime[]),
    ...getAllInlineFunctions(qpqConfig).map((f) => f.runtime),
    ...getAllDynamicFunctions(qpqConfig).map((f) => f.runtime),
  ];

  return expandSrcEntriesWithActionProcessors(result);
};

export const getApiBuildPath = (qpqConfig: QPQConfig): string => {
  const [apiBuildPathConfig] = getConfigSettings<ApiBuildPathQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.apiBuildPath);

  if (!apiBuildPathConfig) {
    throw new Error(`Can not find app base path use defineApiBuildPath or defineApplicationModule`);
  }

  return apiBuildPathConfig.apiBuildPath;
};

export const getSrcFilenameFromQpqFunctionRuntime = (qpqFunctionRuntime: QpqFunctionRuntime): string => {
  if (isQpqFunctionRuntimeAdvanced(qpqFunctionRuntime)) {
    return qpqFunctionRuntime.relativePath.split('/').pop() || '';
  }

  const [srcPath] = qpqFunctionRuntime.split('::');
  return srcPath.split('/').pop() || '';
};

export const getSecretByName = (secretName: string, qpqConfig: QPQConfig): SecretQPQConfigSetting => {
  const secrets = getConfigSettings<SecretQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.secret);

  const secret = secrets.find((s) => s.key === secretName);

  if (!secret) {
    throw new Error(`Can not find secret [${secretName}]`);
  }

  return secret;
};

export const getAllSecretConfigs = (qpqConfig: QPQConfig): SecretQPQConfigSetting[] => {
  const secrets = getConfigSettings<SecretQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.secret);

  return secrets;
};

export const getOwnedSecrets = (qpqConfig: QPQConfig): SecretQPQConfigSetting[] => {
  const secrets = getAllSecretConfigs(qpqConfig);

  return getOwnedItems(secrets, qpqConfig);
};

export const getCryptoKeyByName = (cryptoKeyName: string, qpqConfig: QPQConfig): CryptoKeyQPQConfigSetting => {
  const cryptoKeys = getConfigSettings<CryptoKeyQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.cryptoKey);

  const cryptoKey = cryptoKeys.find((k) => k.keyName === cryptoKeyName);

  if (!cryptoKey) {
    throw new Error(`Can not find crypto key [${cryptoKeyName}]`);
  }

  return cryptoKey;
};

export const getAllCryptoKeyConfigs = (qpqConfig: QPQConfig): CryptoKeyQPQConfigSetting[] => {
  const cryptoKeys = getConfigSettings<CryptoKeyQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.cryptoKey);

  return cryptoKeys;
};

export const getOwnedCryptoKeys = (qpqConfig: QPQConfig): CryptoKeyQPQConfigSetting[] => {
  const cryptoKeys = getAllCryptoKeyConfigs(qpqConfig);

  return getOwnedItems(cryptoKeys, qpqConfig);
};

export const getGlobalConfigValue = <T>(qpqConfig: QPQConfig, name: string): T => {
  const global = getConfigSettings<GlobalQPQConfigSetting<T>>(qpqConfig, QPQCoreConfigSettingType.global).find((g) => g.key === name);

  if (!global) {
    throw new Error(`Global config ${name} not found`);
  }

  return global.value;
};

// Resolves a global by name, giving precedence to globals declared on the
// executing function (functionGlobals) before falling back to the service-wide
// config global. Throws (via getGlobalConfigValue) if the name is found in neither.
export const resolveGlobalValue = <T>(qpqConfig: QPQConfig, functionGlobals: Record<string, unknown> | undefined, name: string): T => {
  if (functionGlobals && Object.prototype.hasOwnProperty.call(functionGlobals, name)) {
    return functionGlobals[name] as T;
  }

  return getGlobalConfigValue<T>(qpqConfig, name);
};

export const getUserDirectories = (configs: QPQConfig): UserDirectoryQPQConfigSetting[] => {
  const userDirectories = getConfigSettings<UserDirectoryQPQConfigSetting>(configs, QPQCoreConfigSettingType.userDirectory);

  return userDirectories;
};

export const getOwnedUserDirectories = (qpqConifg: QPQConfig): UserDirectoryQPQConfigSetting[] => {
  const userDirectories = getUserDirectories(qpqConifg);

  return getOwnedItems(userDirectories, qpqConifg);
};

export const getUserDirectoryByName = (userDirectoryName: string, qpqConifg: QPQConfig): UserDirectoryQPQConfigSetting => {
  const userDirectory = getUserDirectories(qpqConifg).find((ud) => ud.name === userDirectoryName);

  if (!userDirectory) {
    throw new Error(`UserDirectory not found: ${userDirectoryName}`);
  }

  return userDirectory;
};

export const getAllParameterConfigs = (qpqConfig: QPQConfig): ParameterQPQConfigSetting[] => {
  const parameters = getConfigSettings<ParameterQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.parameter);

  return parameters;
};

export const getParameterConfig = (name: string, qpqConfig: QPQConfig): ParameterQPQConfigSetting => {
  const parameters = getConfigSettings<ParameterQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.parameter);

  const param = parameters.find((p) => p.key === name);

  if (!param) {
    throw new Error(`Parameter ${name} not found`);
  }

  return param;
};

export const getOwnedParameterConfigs = (qpqConfig: QPQConfig): ParameterQPQConfigSetting[] => {
  const parameters = getAllParameterConfigs(qpqConfig);

  return getOwnedItems(parameters, qpqConfig);
};

/**
 * Merges every `defineBackendBundleOptions` in the config into a single set of
 * bundler directives. Services compose config from many fragments, so each
 * fragment can declare the build quirks of its own dependencies.
 */
export const getBackendBundleOptions = (qpqConfig: QPQConfig): Required<BackendBundleOptions> => {
  const settings = getConfigSettings<BackendBundleOptionsQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.backendBundleOptions);

  return {
    externals: settings.flatMap((setting) => setting.externals),
    ignoreModules: settings.flatMap((setting) => setting.ignoreModules),
    ignoreWarnings: settings.flatMap((setting) => setting.ignoreWarnings),
  };
};

/**
 * Merges every `defineFrontendBundleOptions` in the config into a single set
 * of views-bundler directives.
 */
export const getFrontendBundleOptions = (qpqConfig: QPQConfig): Required<FrontendBundleOptions> => {
  const settings = getConfigSettings<FrontendBundleOptionsQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.frontendBundleOptions);

  return {
    sharedSingletons: settings.flatMap((setting) => setting.sharedSingletons),
  };
};

export const getUniqueKeyForSetting = (setting: QPQConfigSetting) => {
  const type = setting.configSettingType.split('/').pop();
  const key = setting.uniqueKey;

  return `${type}${key}`;
};

export const getQueueConfigSettingByName = (name: string, qpqConfig: QPQConfig): QueueQPQConfigSetting | undefined => {
  const queueConfigs = getConfigSettings<QueueQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.queue);

  return queueConfigs.find((c) => c.name === name);
};

export const getQueueQueueProcessors = (name: string, qpqConfig: QPQConfig): QpqQueueProcessors => {
  return getQueueConfigSettingByName(name, qpqConfig)?.qpqQueueProcessors || {};
};

export const convertCustomFullyQualifiedResourceToGeneric = <T extends string>(resource: CustomFullyQualifiedResource<T>): FullyQualifiedResource => {
  type KeyType = KeyOf<CustomFullyQualifiedResource<T>>;
  const key: KeyType = Array.from(Object.keys(resource)).find(
    (k) => k !== 'module' && k !== 'application' && k !== 'feature' && k !== 'environment',
  ) as any as KeyType;

  const resourceName = resource[key as T];

  return {
    module: resource.module,
    application: resource.application,
    feature: resource.feature,
    environment: resource.environment,
    resourceName: resourceName,
  };
};

export const getFullyQualifiedResourceName = (qpqConfig: QPQConfig, resourceName: string, config?: QPQConfigSetting): FullyQualifiedResource => {
  const confApplication = getApplicationName(qpqConfig);
  const confEnvironment = getApplicationModuleEnvironment(qpqConfig);
  const confFeature = getApplicationModuleFeature(qpqConfig);
  const confModule = getApplicationModuleName(qpqConfig);

  return {
    resourceName: config?.owner?.resourceNameOverride || resourceName,

    application: config?.owner?.application || confApplication,
    environment: config?.owner?.environment || confEnvironment,
    module: config?.owner?.module || confModule,
    feature: config?.owner?.feature || confFeature || '',
  };
};

// Fully Qualified Resource Names
export const getKeyValueStoreFullyQualifiedResourceName = (kvsName: string, qpqConfig: QPQConfig): FullyQualifiedResource => {
  const storeConfig = getKeyValueStoreByName(qpqConfig, kvsName);

  return getFullyQualifiedResourceName(qpqConfig, kvsName, storeConfig);
};

export const isSameResource = (resourceA: FullyQualifiedResource, resourceB: FullyQualifiedResource): boolean => {
  return (
    resourceA.application === resourceB.application &&
    resourceA.environment === resourceB.environment &&
    resourceA.feature === resourceB.feature &&
    resourceA.module === resourceB.module &&
    resourceA.resourceName === resourceB.resourceName
  );
};

export const getFullUrlFromConfigUrl = (configUrl: ConfigUrl, qpqConfig: QPQConfig): string => {
  if (typeof configUrl === 'string') {
    return configUrl;
  }

  const confEnvironment = getApplicationModuleEnvironment(qpqConfig);
  const confFeature = getApplicationModuleFeature(qpqConfig);

  let fullUrl = `${configUrl.domain}`;

  if (confEnvironment !== 'production') {
    fullUrl = `${confEnvironment}.${fullUrl}`;
  }

  if (confFeature) {
    fullUrl = `${confFeature}.${fullUrl}`;
  }

  if (configUrl.module) {
    fullUrl = `${configUrl.module}.${fullUrl}`;
  }

  if (configUrl.path) {
    fullUrl = `${fullUrl}${configUrl.path}`;
  }

  fullUrl = `${configUrl.protocol}://${fullUrl}`;

  return fullUrl;
};
