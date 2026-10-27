import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from '@qpqjs/core';

import { getMetricPutActionProcessor } from './getMetricPutActionProcessor';

export const getMetricActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getMetricPutActionProcessor(qpqConfig, dynamicModuleLoader)),
});
