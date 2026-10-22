import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getUserScriptBuildActionProcessor } from './getUserScriptBuildActionProcessor';

/** The resolver defineUserScriptBuilder points a service at; the shape every defineActionProcessors module must export. */
export const getUserScriptBuildActionProcessors: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getUserScriptBuildActionProcessor(qpqConfig, dynamicModuleLoader)),
});
