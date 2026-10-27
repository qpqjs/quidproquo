import { CrossModuleOwner, QPQConfigAdvancedSettings, QPQConfigSetting, qpqCoreUtils, QpqFunctionRuntime } from 'quidproquo-core';

import { QPQWebServerConfigSettingType } from '../QPQConfig';

export interface QPQConfigAdvancedServiceFunctionSettings extends QPQConfigAdvancedSettings {
  functionName?: string;
  virtualNetworkName?: string;

  // Cap (and guarantee) on this service function's concurrent executions:
  // never throttled below it, never scales above it. Free, but carved out of
  // the deploy account's shared concurrency pool.
  maxConcurrentExecutions?: number;

  owner?: CrossModuleOwner<'functionName'>;
}

export interface ServiceFunctionQPQWebServerConfigSetting extends QPQConfigSetting {
  runtime: QpqFunctionRuntime;

  functionName: string;
  virtualNetworkName?: string;

  maxConcurrentExecutions?: number;
}

export const defineServiceFunction = (
  runtime: QpqFunctionRuntime,
  options?: QPQConfigAdvancedServiceFunctionSettings,
): ServiceFunctionQPQWebServerConfigSetting => {
  const functionName = options?.functionName || qpqCoreUtils.getStoryNameFromQpqFunctionRuntime(runtime);

  return {
    configSettingType: QPQWebServerConfigSettingType.ServiceFunction,
    uniqueKey: functionName,

    runtime,

    functionName: functionName,

    virtualNetworkName: options?.virtualNetworkName,

    maxConcurrentExecutions: options?.maxConcurrentExecutions,

    owner: qpqCoreUtils.convertCrossModuleOwnerToGenericResourceNameOverride(options?.owner),
  };
};
