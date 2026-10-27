import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

import { getEventAutoRespondActionProcessor } from './getEventAutoRespondActionProcessor';
import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';
import { getEventGetStorySessionActionProcessor } from './getEventGetStorySessionActionProcessor';
import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';
import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';

export const getLambdaServiceFunctionEventProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getEventAutoRespondActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getEventGetRecordsActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getEventGetStorySessionActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getEventMatchStoryActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getEventTransformResponseResultActionProcessor(qpqConfig, dynamicModuleLoader)),
});
