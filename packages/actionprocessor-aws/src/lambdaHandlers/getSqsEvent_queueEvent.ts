import {
  askProcessEvent,
  askProcessEventWithGroupOrdering,
  DynamicModuleLoader,
  QPQConfig,
  QpqRuntimeType,
  QueueEvent,
  QueueMessage,
} from '@qpqjs/core';

import { SQSEvent } from 'aws-lambda';

import { getSqsQueueEventProcessor } from '../getActionProcessor';
import { getQueueConfigSetting } from '../getActionProcessor/core/event/sqs/queue/getEventMatchStoryActionProcessor';
import { getBlankStorySession } from './helpers/getBlankStorySession';
import { requireLambdaEnvironment } from './helpers/getLambdaEnvironment';
import { getQpqLambdaRuntimeForEvent } from './helpers/getQpqLambdaRuntimeForEvent';

const getProcessEventStory = (qpqConfig: QPQConfig, queueName: string): typeof askProcessEvent => {
  // FIFO queues must process records one group at a time, blocking a group once a record fails
  if (getQueueConfigSetting(qpqConfig, queueName).isFifo) {
    return function* askProcessQueueEventWithGroupOrdering(...eventArguments) {
      return yield* askProcessEventWithGroupOrdering((record: QueueEvent<QueueMessage<unknown>>) => record.groupId, ...eventArguments);
    };
  }

  return askProcessEvent;
};

export const getSqsEvent_queueEvent = (dynamicModuleLoader: DynamicModuleLoader, qpqConfig: QPQConfig) => {
  const queueName = requireLambdaEnvironment('queueName');

  return getQpqLambdaRuntimeForEvent<SQSEvent>(
    QpqRuntimeType.QUEUE_EVENT,
    getBlankStorySession,
    getSqsQueueEventProcessor(queueName),
    dynamicModuleLoader,
    qpqConfig,
    () => getProcessEventStory(qpqConfig, queueName),
  );
};
