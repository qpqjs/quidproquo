import { CrossModuleOwner, QPQConfigAdvancedSettings, QPQConfigSetting, qpqCoreUtils, QpqFunctionRuntime } from '@qpqjs/core';

import { QPQWebServerConfigSettingType } from '../QPQConfig';

export type QPQConfigAdvancedServiceFunctionSettings = {
  functionName?: string;
  virtualNetworkName?: string;

  // Cap (and guarantee) on this service function's concurrent executions:
  // never throttled below it, never scales above it. Free, but carved out of
  // the deploy account's shared concurrency pool.
  maxConcurrentExecutions?: number;

  owner?: CrossModuleOwner<'functionName'>;
} & QPQConfigAdvancedSettings;

export type ServiceFunctionQPQWebServerConfigSetting = {
  runtime: QpqFunctionRuntime;

  functionName: string;
  virtualNetworkName?: string;

  maxConcurrentExecutions?: number;
} & QPQConfigSetting;

export const defineServiceFunction = (
  runtime: QpqFunctionRuntime,
  options?: QPQConfigAdvancedServiceFunctionSettings,
): ServiceFunctionQPQWebServerConfigSetting => {
  const functionName = options?.functionName ?? qpqCoreUtils.getStoryNameFromQpqFunctionRuntime(runtime);

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
