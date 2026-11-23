import { defineQueue, QPQConfig } from 'quidproquo';

import { SMOKE_BUSY_QUEUE } from '../constants/SMOKE_BUSY_QUEUE';
import { SMOKE_BUSY_QUEUE_MESSAGE_TYPE } from '../constants/SMOKE_BUSY_QUEUE_MESSAGE_TYPE';
import { SMOKE_BUSY_QUEUE_RETRY_SECONDS } from '../constants/SMOKE_BUSY_QUEUE_RETRY_SECONDS';

/**
 * A queue whose consumer may only run one at a time. `maxTries` is deliberately left to the
 * framework's default: the test proves that default is enough for a message that arrives while
 * the consumer is busy to be tried again rather than lost.
 */
export const defineBusyQueueSmoke = (): QPQConfig => [
  defineQueue(
    SMOKE_BUSY_QUEUE,
    {
      [SMOKE_BUSY_QUEUE_MESSAGE_TYPE]: {
        basePath: __dirname,
        relativePath: '../entry/queue/onSmokeBusyQueueMessage',
        functionName: 'onSmokeBusyQueueMessage',
      },
    },
    {
      maxConcurrentExecutions: 1,
      concurrency: 1,
      batchSize: 1,
      ttRetryInSeconds: SMOKE_BUSY_QUEUE_RETRY_SECONDS,
    },
  ),
];
