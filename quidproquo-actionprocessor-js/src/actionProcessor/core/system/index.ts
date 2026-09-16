import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getSystemBatchActionProcessor } from './getSystemBatchActionProcessor';
import { getSystemGetRuntimeCorrelationActionProcessor } from './getSystemGetRuntimeCorrelationActionProcessor';
import { getSystemGetRuntimeRemainingTimeActionProcessor } from './getSystemGetRuntimeRemainingTimeActionProcessor';

export const getSystemActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getSystemBatchActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getSystemGetRuntimeCorrelationActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getSystemGetRuntimeRemainingTimeActionProcessor(qpqConfig, dynamicModuleLoader)),
});
