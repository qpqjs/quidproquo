import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getInlineFunctionExecuteActionProcessor } from './getInlineFunctionExecuteActionProcessor';

export const getInlineFunctionActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getInlineFunctionExecuteActionProcessor(qpqConfig, dynamicModuleLoader)),
});
