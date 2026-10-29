import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from '@qpqjs/core';

import { LambdaRuntimeConfig } from '../../../../../runtimeConfig/LambdaRuntimeConfig';
import { getEventAutoRespondActionProcessor } from './getEventAutoRespondActionProcessor';
import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';
import { getEventGetStorySessionActionProcessor } from './getEventGetStorySessionActionProcessor';
import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';
import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';

export const getEventBridgeEventActionProcessor =
  (lambdaRuntimeConfig: LambdaRuntimeConfig): ActionProcessorListResolver =>
  async (qpqConfig: QPQConfig, dynamicModuleLoader: DynamicModuleLoader): Promise<ActionProcessorList> => ({
    ...(await getEventAutoRespondActionProcessor(qpqConfig, dynamicModuleLoader)),
    ...(await getEventGetRecordsActionProcessor(qpqConfig, dynamicModuleLoader)),
    ...(await getEventGetStorySessionActionProcessor(qpqConfig, dynamicModuleLoader)),
    ...(await getEventMatchStoryActionProcessor(lambdaRuntimeConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getEventTransformResponseResultActionProcessor(qpqConfig, dynamicModuleLoader)),
  });
