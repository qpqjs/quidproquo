import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from '@qpqjs/core';

import { getDateNowActionProcessor } from './getDateNowActionProcessor';

export const getDateActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getDateNowActionProcessor(qpqConfig, dynamicModuleLoader)),
});
