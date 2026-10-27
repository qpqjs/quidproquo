import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getAiGetModelRegionsActionProcessor } from './getAiGetModelRegionsActionProcessor';
import { getAiPromptActionProcessor } from './getAiPromptActionProcessor';
import { getAiPromptStreamActionProcessor } from './getAiPromptStreamActionProcessor';

export const getAiActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getAiPromptActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getAiPromptStreamActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getAiGetModelRegionsActionProcessor(qpqConfig, dynamicModuleLoader)),
});
