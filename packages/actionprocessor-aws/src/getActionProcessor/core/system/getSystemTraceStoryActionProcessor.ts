// Deep import (not the package root) so lambda bundles only pull the tracer subtree —
// the node package's root index drags in processors (Claude SDK etc.) every lambda
// would otherwise ship.
import { getSystemTraceStoryActionProcessor as getNodeSystemTraceStoryActionProcessor } from 'quidproquo-actionprocessor-node/lib/commonjs/traceStoryExecution';
import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

// The federated code cache on /tmp — where loadFederatedStory materialises the service's
// published chunks. Tracing every script under it covers multi-chunk bundles (the story
// function's own script is auto-detected regardless).
const getFederatedCodeCachePattern = (): string => {
  const cacheRoot = process.env.federatedCodeStoreCacheDir || '/tmp/qpq-federated-code';
  // Escape regex specials — the pattern is matched against script urls
  return cacheRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const getSystemTraceStoryActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => getNodeSystemTraceStoryActionProcessor([getFederatedCodeCachePattern()])(qpqConfig, dynamicModuleLoader);
