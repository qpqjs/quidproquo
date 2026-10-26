import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { ResolvedDevServerConfig } from '../../../types';
import { getUserScriptExecuteActionProcessor } from './getUserScriptExecuteActionProcessor';

export * from './getUserScriptChildEnv';
export * from './getUserScriptExecuteActionProcessor';

export const getUserScriptActionProcessor =
  (devServerConfig: ResolvedDevServerConfig): ActionProcessorListResolver =>
  async (qpqConfig: QPQConfig, dynamicModuleLoader: DynamicModuleLoader): Promise<ActionProcessorList> => ({
    ...(await getUserScriptExecuteActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
  });
