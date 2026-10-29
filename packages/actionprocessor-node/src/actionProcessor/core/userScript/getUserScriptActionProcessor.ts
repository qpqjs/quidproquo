import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from '@qpqjs/core';

import { getUserScriptModuleTypesActionProcessor } from './getUserScriptModuleTypesActionProcessor';

// No execute processor here on purpose: a script only ever runs in a runtime's sandbox
// (the lambda runner, the dev server's child process), never in the host's process.
export const getUserScriptActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getUserScriptModuleTypesActionProcessor(qpqConfig, dynamicModuleLoader)),
});
