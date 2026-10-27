import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getConfigGetParameterActionProcessor } from './getConfigGetParameterActionProcessor';
import { getConfigGetParametersActionProcessor } from './getConfigGetParametersActionProcessor';
import { getConfigGetSecretActionProcessor } from './getConfigGetSecretActionProcessor';
import { getConfigListParametersActionProcessor } from './getConfigListParametersActionProcessor';
import { getConfigSetParameterActionProcessor } from './getConfigSetParameterActionProcessor';

export const getConfigActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getConfigGetParameterActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getConfigGetParametersActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getConfigGetSecretActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getConfigListParametersActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getConfigSetParameterActionProcessor(qpqConfig, dynamicModuleLoader)),
});
