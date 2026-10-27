import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getStreamCloseActionProcessor } from './getStreamCloseActionProcessor';
import { getStreamReadActionProcessor } from './getStreamReadActionProcessor';

export const getStreamActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getStreamCloseActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getStreamReadActionProcessor(qpqConfig, dynamicModuleLoader)),
});
