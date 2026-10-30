import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from '@qpqjs/core';

import { ResolvedDevServerConfig } from '../../../types';
import { getUserScriptExecuteActionProcessor } from './getUserScriptExecuteActionProcessor';
import { getUserScriptListExportsActionProcessor } from './getUserScriptListExportsActionProcessor';

export const getUserScriptActionProcessor =
  (devServerConfig: ResolvedDevServerConfig): ActionProcessorListResolver =>
  async (qpqConfig: QPQConfig, dynamicModuleLoader: DynamicModuleLoader): Promise<ActionProcessorList> => ({
    ...(await getUserScriptExecuteActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getUserScriptListExportsActionProcessor(devServerConfig)(qpqConfig, dynamicModuleLoader)),
  });
