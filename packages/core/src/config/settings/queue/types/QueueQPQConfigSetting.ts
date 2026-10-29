import { QPQConfigSetting } from '../../../QPQConfig';
import { QpqQueueProcessors } from './QpqQueueProcessors';

export type QueueQPQConfigSetting = {
  name: string;

  batchSize: number;
  batchWindowInSeconds: number;

  concurrency: number;

  maxTries: number;
  ttRetryInSeconds: number;

  hasDeadLetterQueue: boolean;
  qpqQueueProcessors: QpqQueueProcessors;

  eventBusSubscriptions: string[];

  maxConcurrentExecutions?: number;

  isFifo: boolean;
} & QPQConfigSetting;
