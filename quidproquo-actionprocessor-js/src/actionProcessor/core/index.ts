import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getConfigActionProcessor } from './config';
import { getContextActionProcessor } from './context';
import { getDateActionProcessor } from './date';
import { getErrorActionProcessor } from './error';
import { getGuidActionProcessor } from './guid';
import { getLogActionProcessor } from './log';
import { getMathActionProcessor } from './math';
import { getMetricActionProcessor } from './metric';
import { getNetworkActionProcessor } from './network';
import { getPlatformActionProcessor } from './platform';
import { getSystemActionProcessor } from './system';

export * from './config';
export * from './context';
export * from './date';
export * from './error';
export * from './guid';
export * from './log';
export * from './math';
export * from './metric';
export * from './network';
export * from './platform';
export * from './system';

// customActions is exported but deliberately NOT merged into getCoreActionProcessor:
// composition roots (dev-server, awslambda) spread it last so user-defined processors
// can override the built-in ones.
export * from './customActions';

export const getCoreActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getConfigActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getContextActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getDateActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getErrorActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getGuidActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getLogActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getMathActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getMetricActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getNetworkActionProcessor(qpqConfig, dynamicModuleLoader)),
  // Every real runtime overrides this with its own name.
  ...(await getPlatformActionProcessor('js')(qpqConfig, dynamicModuleLoader)),
  ...(await getSystemActionProcessor(qpqConfig, dynamicModuleLoader)),
});
