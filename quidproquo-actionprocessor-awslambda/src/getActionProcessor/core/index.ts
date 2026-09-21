export * from './ai';
export * from './apiKeyValidation';
export * from './config';
export * from './crypto';
export * from './event';
export * from './eventBus';
export * from './file';
export * from './graphDatabase';
export * from './keyValueStore';
export * from './metric';
export * from './queue';
export * from './system';
export * from './userDirectory';

import { getPlatformActionProcessor } from 'quidproquo-actionprocessor-js';
import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';
import { getRouteAuthValidationActionProcessor } from 'quidproquo-webserver';

import { getAiActionProcessor } from './ai';
import { getApiKeyValidationActionProcessor } from './apiKeyValidation';
import { getConfigActionProcessor } from './config';
import { getCryptoActionProcessor } from './crypto';
import { getApiGatewayApiEventEventProcessor } from './event';
import { getEventBusActionProcessor } from './eventBus';
import { getFileActionProcessor } from './file';
import { getGraphDatabaseActionProcessor } from './graphDatabase';
import { getKeyValueStoreActionProcessor } from './keyValueStore';
import { getMetricActionProcessor } from './metric';
import { getQueueActionProcessor } from './queue';
import { getSystemActionProcessor } from './system';
import { getUserDirectoryActionProcessor } from './userDirectory';

export const getCoreActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getPlatformActionProcessor('aws')(qpqConfig, dynamicModuleLoader)),
  ...(await getAiActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getApiKeyValidationActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getFileActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getKeyValueStoreActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getMetricActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getQueueActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getUserDirectoryActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getEventBusActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getSystemActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getConfigActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getCryptoActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getApiGatewayApiEventEventProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getGraphDatabaseActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getRouteAuthValidationActionProcessor(qpqConfig, dynamicModuleLoader)),
});
