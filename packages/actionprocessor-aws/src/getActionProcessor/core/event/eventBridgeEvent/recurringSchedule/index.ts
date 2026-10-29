import { getEventAutoRespondNoopActionProcessor, getEventGetStorySessionNoopActionProcessor } from '@qpqjs/actionprocessor-js';
import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from '@qpqjs/core';

import { LambdaRuntimeConfig } from '../../../../../runtimeConfig/LambdaRuntimeConfig';
import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';
import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';
import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';

export const getEventBridgeEventActionProcessor =
  (lambdaRuntimeConfig: LambdaRuntimeConfig): ActionProcessorListResolver =>
  async (qpqConfig: QPQConfig, dynamicModuleLoader: DynamicModuleLoader): Promise<ActionProcessorList> => ({
    ...(await getEventAutoRespondNoopActionProcessor(qpqConfig, dynamicModuleLoader)),
    ...(await getEventGetRecordsActionProcessor(qpqConfig, dynamicModuleLoader)),
    ...(await getEventGetStorySessionNoopActionProcessor(qpqConfig, dynamicModuleLoader)),
    ...(await getEventMatchStoryActionProcessor(lambdaRuntimeConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getEventTransformResponseResultActionProcessor(qpqConfig, dynamicModuleLoader)),
  });
