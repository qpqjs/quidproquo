import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getSystemExecuteStoryActionProcessor } from './getSystemExecuteStoryActionProcessor';
import { getSystemTraceStoryActionProcessor } from './getSystemTraceStoryActionProcessor';

export const getSystemActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getSystemExecuteStoryActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getSystemTraceStoryActionProcessor(qpqConfig, dynamicModuleLoader)),
});
