import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getUserScriptBuildActionProcessor } from './getUserScriptBuildActionProcessor';
import { getUserScriptBuildFromZipActionProcessor } from './getUserScriptBuildFromZipActionProcessor';

/** The resolver defineUserScriptBuilder points a service at: both build actions, from a directory and from a zip. */
export const getUserScriptBuildActionProcessors: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getUserScriptBuildActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getUserScriptBuildFromZipActionProcessor(qpqConfig, dynamicModuleLoader)),
});
