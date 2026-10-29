import { getEventAutoRespondNoopActionProcessor, getEventGetStorySessionNoopActionProcessor } from '@qpqjs/actionprocessor-js';
import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from '@qpqjs/core';

import { KvsStreamLambdaSettings } from '../../../../../runtimeConfig/KvsStreamLambdaSettings';
import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';
import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';
import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';

export const getDynamoKvsStreamEventProcessor =
  (settings: KvsStreamLambdaSettings): ActionProcessorListResolver =>
  async (qpqConfig: QPQConfig, dynamicModuleLoader: DynamicModuleLoader): Promise<ActionProcessorList> => ({
    ...(await getEventAutoRespondNoopActionProcessor(qpqConfig, dynamicModuleLoader)),
    ...(await getEventGetRecordsActionProcessor(settings)(qpqConfig, dynamicModuleLoader)),
    ...(await getEventGetStorySessionNoopActionProcessor(qpqConfig, dynamicModuleLoader)),
    ...(await getEventMatchStoryActionProcessor(settings.runtime)(qpqConfig, dynamicModuleLoader)),
    ...(await getEventTransformResponseResultActionProcessor(qpqConfig, dynamicModuleLoader)),
  });
