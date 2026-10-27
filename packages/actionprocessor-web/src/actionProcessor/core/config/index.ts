import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getConfigGetParameterActionProcessor } from './getConfigGetParameterActionProcessor';
import { getConfigGetParametersActionProcessor } from './getConfigGetParametersActionProcessor';
import { getConfigSetParameterActionProcessor } from './getConfigSetParameterActionProcessor';

export const getConfigActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getConfigGetParameterActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getConfigGetParametersActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getConfigSetParameterActionProcessor(qpqConfig, dynamicModuleLoader)),
});
