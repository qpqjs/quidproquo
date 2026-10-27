import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from '@qpqjs/core';

import { getApiKeyValidationValidateActionProcessor } from './getApiKeyValidationValidateActionProcessor';

export const getApiKeyValidationActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getApiKeyValidationValidateActionProcessor(qpqConfig, dynamicModuleLoader)),
});
