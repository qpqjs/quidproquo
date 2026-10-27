import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getConfigGetApplicationInfoActionProcessor } from './getConfigGetApplicationInfoActionProcessor';
import { getConfigGetGlobalActionProcessor } from './getConfigGetGlobalActionProcessor';

export const getConfigActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getConfigGetApplicationInfoActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getConfigGetGlobalActionProcessor(qpqConfig, dynamicModuleLoader)),
});
