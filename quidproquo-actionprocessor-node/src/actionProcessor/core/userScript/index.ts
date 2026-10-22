import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getUserScriptExecuteActionProcessor } from './getUserScriptExecuteActionProcessor';

export * from './getUserScriptExecuteActionProcessor';
export * from './logic';

export const getUserScriptActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getUserScriptExecuteActionProcessor(qpqConfig, dynamicModuleLoader)),
});
