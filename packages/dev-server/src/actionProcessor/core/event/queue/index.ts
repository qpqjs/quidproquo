import { getSqsQueueEventMatchStoryActionProcessor, ResolveQueueName } from '@qpqjs/actionprocessor-aws';
import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from '@qpqjs/core';

import { getEventAutoRespondActionProcessor } from './getEventAutoRespondActionProcessor';
import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';
import { getEventGetStorySessionActionProcessor } from './getEventGetStorySessionActionProcessor';
import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';
import { AnyQueueMessageWithSession } from './types';

// Locally the queue name rides on the message itself; on lambda it comes from the environment.
const resolveQueueNameFromMessage: ResolveQueueName = ([event]) => (event as AnyQueueMessageWithSession).queueName;

export const getQueueEventProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getEventAutoRespondActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getEventGetRecordsActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getEventGetStorySessionActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getSqsQueueEventMatchStoryActionProcessor(resolveQueueNameFromMessage)(qpqConfig, dynamicModuleLoader)),
  ...(await getEventTransformResponseResultActionProcessor(qpqConfig, dynamicModuleLoader)),
});
