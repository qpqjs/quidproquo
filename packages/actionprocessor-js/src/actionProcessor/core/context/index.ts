import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getContextListActionProcessor } from './getContextListActionProcessor';
import { getContextReadActionProcessor } from './getContextReadActionProcessor';

export const getContextActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getContextListActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getContextReadActionProcessor(qpqConfig, dynamicModuleLoader)),
});
