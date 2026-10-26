import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getUserScriptExecuteActionProcessor } from './getUserScriptExecuteActionProcessor';
import { getUserScriptModuleTypesActionProcessor } from './getUserScriptModuleTypesActionProcessor';

export * from './getUserScriptExecuteActionProcessor';
export * from './getUserScriptModuleTypesActionProcessor';
export * from './getUserScriptRunnerActionProcessors';
export * from './logic';

export const getUserScriptActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getUserScriptExecuteActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getUserScriptModuleTypesActionProcessor(qpqConfig, dynamicModuleLoader)),
});
