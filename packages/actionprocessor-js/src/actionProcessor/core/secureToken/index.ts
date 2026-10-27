import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getSecureTokenGenerateActionProcessor } from './getSecureTokenGenerateActionProcessor';

export const getSecureTokenActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getSecureTokenGenerateActionProcessor(qpqConfig, dynamicModuleLoader)),
});
