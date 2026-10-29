import { QPQConfigAdvancedSettings } from '../../../QPQConfig';

export type QPQConfigAdvancedQueueSettings = {
  batchSize?: number;
  batchWindowInSeconds?: number;
  concurrency?: number;
  maxTries?: number;
  ttRetryInSeconds?: number;
  hasDeadLetterQueue?: boolean;
  eventBusSubscriptions?: string[];
  maxConcurrentExecutions?: number;
  isFifo?: boolean;
} & QPQConfigAdvancedSettings;
