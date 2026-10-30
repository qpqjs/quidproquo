import { getEventAutoRespondNoopActionProcessor, getEventGetStorySessionNoopActionProcessor } from '@qpqjs/actionprocessor-js';
import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from '@qpqjs/core';

import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';
import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';
import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';

export const getNodeServiceFunctionEventProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getEventAutoRespondNoopActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getEventGetRecordsActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getEventGetStorySessionNoopActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getEventMatchStoryActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getEventTransformResponseResultActionProcessor(qpqConfig, dynamicModuleLoader)),
});
