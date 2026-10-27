import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getServiceFunctionExecuteActionProcessor } from './getServiceFunctionExecuteActionProcessor';

export const getServiceFunctionActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getServiceFunctionExecuteActionProcessor(qpqConfig, dynamicModuleLoader)),
});
