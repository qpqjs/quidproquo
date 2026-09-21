import { getMetricActionProcessor, getPlatformActionProcessor } from 'quidproquo-actionprocessor-js';
import { getFileActionProcessor, getOwnCodeMarkersFromRoot, getSystemTraceStoryActionProcessor } from 'quidproquo-actionprocessor-node';
import { ActionProcessorList, DynamicModuleLoader, isQpqFunctionRuntimeAdvanced, QPQConfig, qpqCoreUtils, QpqFunctionRuntime } from 'quidproquo-core';
import { getRouteAuthValidationActionProcessor } from 'quidproquo-webserver';

import { ResolvedDevServerConfig } from '../../types';
import { getApiKeyValidationActionProcessor } from './apiKeyValidation';
import { getConfigActionProcessor } from './config';
import { getCryptoActionProcessor } from './crypto';
import { getEventBusActionProcessor } from './eventBus';
import { getGraphDatabaseActionProcessor } from './graphDatabaseOverride';
import { getKeyValueStoreActionProcessor } from './keyValueStore';
import { getLogActionProcessor } from './log';
import { getQueueActionProcessor } from './queue';
import { getUserDirectoryActionProcessor } from './userDirectory';

// The dev server bundles every hosted service plus the whole framework (aliased to
// workspace src/, not node_modules) into one script — the tracer's default "not
// node_modules" own-code heuristic can't tell them apart there, so onlyOwnCode traces
// would otherwise instrument the entire bundle instead of just the traced service.
// Resolve the traced story's own source root and narrow to it.
const resolveDevServerOwnCodeMarkers = (qpqFunctionRuntimeInfo: QpqFunctionRuntime | undefined, qpqConfig: QPQConfig): string[] | undefined => {
  if (!qpqFunctionRuntimeInfo) {
    return undefined;
  }

  try {
    const root = isQpqFunctionRuntimeAdvanced(qpqFunctionRuntimeInfo)
      ? qpqFunctionRuntimeInfo.basePath
      : qpqCoreUtils.getApplicationConfigRoot(qpqConfig);

    return root ? getOwnCodeMarkersFromRoot(root) : undefined;
  } catch {
    // No configRoot resolvable — fall back to the plain node_modules heuristic.
    return undefined;
  }
};

export const getCoreActionProcessor = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
  devServerConfig: ResolvedDevServerConfig,
): Promise<ActionProcessorList> => {
  return {
    ...(await getPlatformActionProcessor('devServer')(qpqConfig, dynamicModuleLoader)),
    ...(await getApiKeyValidationActionProcessor(qpqConfig, dynamicModuleLoader)),
    ...(await getConfigActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getCryptoActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getGraphDatabaseActionProcessor(qpqConfig, dynamicModuleLoader)),
    ...(await getEventBusActionProcessor(qpqConfig, dynamicModuleLoader)),
    ...(await getQueueActionProcessor(qpqConfig, dynamicModuleLoader)),
    ...(await getLogActionProcessor(qpqConfig, dynamicModuleLoader)),
    ...(await getMetricActionProcessor(qpqConfig, dynamicModuleLoader)),
    ...(await getFileActionProcessor(devServerConfig.fileStorageConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getKeyValueStoreActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getRouteAuthValidationActionProcessor(qpqConfig, dynamicModuleLoader)),
    ...(await getUserDirectoryActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getSystemTraceStoryActionProcessor([], resolveDevServerOwnCodeMarkers)(qpqConfig, dynamicModuleLoader)),
  };
};
