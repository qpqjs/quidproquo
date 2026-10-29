import { getEventBusByName } from './config/settings/eventBus/logic';
import { getAllKeyValueStoreConfigs, getKeyValueStoreByName } from './config/settings/keyValueStore/logic';
export { getAllCryptoKeyConfigs, getCryptoKeyByName, getOwnedCryptoKeyConfigs, resolveCryptoKeyOrThrow } from './config/settings/cryptoKey/logic';
export { getAllEventBusConfigs, getEventBusByName, getOwnedEventBusConfigs, resolveEventBusOrThrow } from './config/settings/eventBus/logic';
export {
  getAllSigningKeyConfigs,
  getOwnedSigningKeyConfigs,
  getSigningKeyByName,
  resolveSigningKeyOrThrow,
} from './config/settings/signingKey/logic';
export {
  getAllStorageDriveConfigs,
  getOwnedStorageDriveConfigs,
  getStorageDriveByName,
  resolveStorageDriveOrThrow,
} from './config/settings/storageDrive/logic';
export {
  getAllUserDirectoryConfigs,
  getOwnedUserDirectoryConfigs,
  getUserDirectoryByName,
  resolveUserDirectoryOrThrow,
} from './config/settings/userDirectory/logic';
import { getAllQueueConfigs, getQueueByName } from './config/settings/queue/logic';
import { getAllStorageDriveConfigs } from './config/settings/storageDrive/logic';
import { getAllUserDirectoryConfigs, getOwnedUserDirectoryConfigs } from './config/settings/userDirectory/logic';
import {
  getApplicationConfigSetting,
  getApplicationModuleEnvironment,
  getApplicationModuleFeature,
  getApplicationModuleName,
  getApplicationName,
  getConfigSetting,
  getConfigSettings,
  getOwnedItems,
} from './logic/config';
import { CrossModuleOwner } from './types/CrossModuleOwner';
import {
  ActionProcessorsQPQConfigSetting,
  AiQPQConfigSetting,
  ApiBuildPathQPQConfigSetting,
  ApplicationQPQConfigSetting,
  BackendBundleOptions,
  BackendBundleOptionsQPQConfigSetting,
  BundleEntriesQPQConfigSetting,
  defineJavascriptRuntime,
  DeployEventsQPQConfigSetting,
  DynamicFunctionsQPQConfigSetting,
  EmailTemplates,
  EnvironmentSettingsQPQConfigSetting,
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
  QPQConfig,
  QPQConfigItem,
  QPQConfigSetting,
  QPQCoreConfigSettingType,
  QpqQueueProcessors,
  QueueQPQConfigSetting,
  ScheduleQPQConfigSetting,
  ServiceSettingsQPQConfigSetting,
  UserDirectoryQPQConfigSetting,
  UserScriptModuleQPQConfigSetting,
  UserScriptRunnerQPQConfigSetting,
  VirtualNetworkQPQConfigSetting,
} from './config';
import {
  ConfigUrl,
  CrossServiceResourceName,
  CustomFullyQualifiedResource,
  FullyQualifiedResource,
  KeyOf,
  Nullable,
  QpqFunctionRuntime,
  ResourceName,
} from './types';
import { isQpqFunctionRuntimeAdvanced } from './utils';

// The config walk and the application accessors live in logic/config; they are part of this
// namespace for callers.
export {
  getAllKeyValueStoreConfigs,
  getKeyValueStoreByName,
  getOwnedKeyValueStoreConfigs,
  resolveKeyValueStoreOrThrow,
} from './config/settings/keyValueStore/logic';
export { getAllParameterConfigs, getOwnedParameterConfigs, getParameterByName, resolveParameterOrThrow } from './config/settings/parameter/logic';
export { getAllQueueConfigs, getOwnedQueueConfigs, getQueueByName, resolveQueueOrThrow } from './config/settings/queue/logic';
export { getAllSecretConfigs, getOwnedSecretConfigs, getSecretByName, resolveSecretOrThrow } from './config/settings/secret/logic';
export {
  flattenQpqConfig,
  getApplicationConfigSetting,
  getApplicationModuleEnvironment,
  getApplicationModuleFeature,
  getApplicationModuleName,
  getApplicationName,
  getConfigSetting,
  getConfigSettings,
  getOwnedItems,
} from './logic/config';

export const getConfigRoot = (qpqConfig: QPQConfig): string => {
  return getApplicationConfigSetting(qpqConfig).configRoot;
};

export const getFederatedModuleStore = (qpqConfig: QPQConfig): FederatedModuleStoreQPQConfigSetting | undefined => {
  return getConfigSetting<FederatedModuleStoreQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.federatedModuleStore);
};

export const getNotifyErrorConfigs = (configs: QPQConfig): NotifyErrorQPQConfigSetting[] => {
  return getConfigSettings<NotifyErrorQPQConfigSetting>(configs, QPQCoreConfigSettingType.notifyError);
};

// A FIFO queue can only be fed by a FIFO event bus - standard SNS topics cannot deliver
// to FIFO SQS queues at all. Called at deploy/startup time (the queue and bus are separate
// settings, so defineQueue can't validate this on its own).
export const assertFifoQueueEventBusSubscriptionsAreValid = (qpqConfig: QPQConfig): void => {
  const invalidSubscriptions = getAllQueueConfigs(qpqConfig)
    .filter((queue) => queue.isFifo)
    .flatMap((queue) =>
      queue.eventBusSubscriptions
        .filter((eventBusName) => !getEventBusByName(eventBusName, qpqConfig)?.isFifo)
        .map((eventBusName) => `queue [${queue.name}] -> event bus [${eventBusName}]`),
    );

  if (invalidSubscriptions.length > 0) {
    throw new Error(
      `FIFO queues can only subscribe to FIFO event buses (standard SNS topics cannot deliver to FIFO SQS queues): ${invalidSubscriptions.join(', ')}`,
    );
  }
};

export const getStorageDriveNames = (configs: QPQConfig): string[] => {
  return getAllStorageDriveConfigs(configs).map((sd) => sd.storageDrive);
};

export const getAllAiConfigs = (qpqConfig: QPQConfig): AiQPQConfigSetting[] => {
  return getConfigSettings<AiQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.ai);
};

// Always resolves - falls back to the defineJavascriptRuntime defaults when no setting is present
export const getJavascriptRuntimeConfig = (qpqConfig: QPQConfig): JavascriptRuntimeQPQConfigSetting => {
  return getConfigSetting<JavascriptRuntimeQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.javascriptRuntime) ?? defineJavascriptRuntime();
};

/** The module a setting belongs to: its declared owner, or the executing module when it declares none. */
export const resolveOwnerModuleName = (owner: CrossModuleOwner | undefined, qpqConfig: QPQConfig): string =>
  owner?.module || getApplicationModuleName(qpqConfig);

export const getAllGraphDatabaseConfigs = (qpqConfig: QPQConfig): GraphDatabaseQPQConfigSetting[] => {
  const graphDatabases = getConfigSettings<GraphDatabaseQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.graphDatabase);

  return graphDatabases;
};

export const getDeployEventConfigs = (qpqConfig: QPQConfig): DeployEventsQPQConfigSetting[] => {
  const deployEvents = getConfigSettings<DeployEventsQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.deployEvent);

  return deployEvents;
};

export const getDeployEventByName = (name: string, qpqConfig: QPQConfig): Nullable<DeployEventsQPQConfigSetting> =>
  getDeployEventConfigs(qpqConfig).find((c) => c.name === name) ?? null;

export const getVirtualNetworkConfigs = (qpqConfig: QPQConfig): VirtualNetworkQPQConfigSetting[] => {
  return getConfigSettings<VirtualNetworkQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.virtualNetwork);
};

export const getOwnedGraphDatabases = (qpqConfig: QPQConfig): GraphDatabaseQPQConfigSetting[] => {
  return getOwnedItems(getAllGraphDatabaseConfigs(qpqConfig), qpqConfig);
};

export const resolveCrossServiceResourceName = (resourceName: ResourceName): CrossServiceResourceName => {
  if (typeof resourceName === 'string') {
    return {
      name: resourceName,
    };
  }

  return resourceName;
};

export const getActionProcessorSources = (configs: QPQConfig): QpqFunctionRuntime[] => {
  const sources = getConfigSettings<ActionProcessorsQPQConfigSetting>(configs, QPQCoreConfigSettingType.actionProcessors).map((ap) => ap.runtime);

  return sources;
};

export const getUserDirectoryEmailTemplates = (qpqConfig: QPQConfig): Record<string, EmailTemplates> => {
  const record = getAllUserDirectoryConfigs(qpqConfig).reduce(
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
  return getAllQueueConfigs(configs).reduce((acc, qc) => [...acc, ...Object.values(qc.qpqQueueProcessors)], [] as QpqFunctionRuntime[]);
};

export const getUserDirectorySrcEntries = (qpqConfig: QPQConfig): QpqFunctionRuntime[] => {
  // We just want the ones this service owns.
  const userConfigs = getOwnedUserDirectoryConfigs(qpqConfig);

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

export const getAllBundleEntries = (qpqConfig: QPQConfig): QpqFunctionRuntime[] => {
  return getConfigSettings<BundleEntriesQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.bundleEntries).flatMap((setting) => setting.runtimes);
};

export const getAllDynamicFunctions = (qpqConfig: QPQConfig): DynamicFunctionsQPQConfigSetting[] => {
  return getConfigSettings<DynamicFunctionsQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.dynamicFunctions);
};

export const getAllUserScriptModules = (qpqConfig: QPQConfig): UserScriptModuleQPQConfigSetting[] => {
  return getConfigSettings<UserScriptModuleQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.userScriptModule);
};

// The sandbox this service runs user scripts in (defineUserScriptRunner), or null when
// the service has not declared one.
export const getUserScriptRunner = (qpqConfig: QPQConfig): Nullable<UserScriptRunnerQPQConfigSetting> => {
  return getConfigSetting<UserScriptRunnerQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.userScriptRunner) ?? null;
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
    ...getAllStorageDriveConfigs(qpqConfig).flatMap((sd) => [sd.onEvent?.create, sd.onEvent?.delete].filter((r) => !!r) as QpqFunctionRuntime[]),
    // A store's change-stream handler. Missing here, the bundler never sees it: the lambda
    // zip omits it and the dev server's dynamic loader has nothing to resolve, so the handler
    // simply never runs, and since nothing throws, the only symptom is a projection that
    // silently stops updating.
    ...(getAllKeyValueStoreConfigs(qpqConfig)
      .map((kvs) => kvs.onStream?.runtime)
      .filter((runtime) => !!runtime) as QpqFunctionRuntime[]),
    ...getAllInlineFunctions(qpqConfig).map((f) => f.runtime),
    ...getAllDynamicFunctions(qpqConfig).map((f) => f.runtime),
    ...getAllBundleEntries(qpqConfig),
    // Loaded only when a script is built or run, so nothing else would make the bundler see it.
    ...getAllUserScriptModules(qpqConfig).flatMap((m) => (m.typesRuntime ? [m.runtime, m.typesRuntime] : [m.runtime])),
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

  const [srcPath = ''] = qpqFunctionRuntime.split('::');
  return srcPath.split('/').pop() || '';
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

export const getQueueQueueProcessors = (name: string, qpqConfig: QPQConfig): QpqQueueProcessors => {
  return getQueueByName(name, qpqConfig)?.qpqQueueProcessors || {};
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
  const storeConfig = getKeyValueStoreByName(kvsName, qpqConfig) ?? undefined;

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
