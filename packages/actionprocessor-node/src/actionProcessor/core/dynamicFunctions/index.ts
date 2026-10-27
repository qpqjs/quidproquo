import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getDynamicFunctionsExecuteActionProcessor } from './getDynamicFunctionsExecuteActionProcessor';

export const getDynamicFunctionsActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getDynamicFunctionsExecuteActionProcessor(qpqConfig, dynamicModuleLoader)),
});
