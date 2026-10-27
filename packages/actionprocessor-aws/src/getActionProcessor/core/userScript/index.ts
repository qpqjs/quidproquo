import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from '@qpqjs/core';

import { getUserScriptExecuteActionProcessor } from './getUserScriptExecuteActionProcessor';
import { getUserScriptListExportsActionProcessor } from './getUserScriptListExportsActionProcessor';

export * from './getUserScriptExecuteActionProcessor';
export * from './getUserScriptListExportsActionProcessor';
export * from './logic';

export const getUserScriptActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getUserScriptExecuteActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getUserScriptListExportsActionProcessor(qpqConfig, dynamicModuleLoader)),
});
