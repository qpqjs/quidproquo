import { QpqFunctionRuntime } from '../../types';
import { QPQConfigAdvancedSettings, QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';

export interface QpqQueueProcessors {
  [type: string]: QpqFunctionRuntime;
}

export interface QPQConfigAdvancedQueueSettings extends QPQConfigAdvancedSettings {
  batchSize?: number;
  batchWindowInSeconds?: number;
  concurrency?: number;
  maxTries?: number;
  ttRetryInSeconds?: number;
  hasDeadLetterQueue?: boolean;
  eventBusSubscriptions?: string[];
  maxConcurrentExecutions?: number;
  isFifo?: boolean;
}

export interface QueueQPQConfigSetting extends QPQConfigSetting {
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
}

export const defineQueue = (name: string, processors: QpqQueueProcessors, options?: QPQConfigAdvancedQueueSettings): QueueQPQConfigSetting => {
  return {
    configSettingType: QPQCoreConfigSettingType.queue,
    uniqueKey: name,

    name,

    batchSize: options?.batchSize || 0,
    // Default 0 — invoke as soon as a message arrives — which is also AWS's own default for
    // MaximumBatchingWindowInSeconds.
    //
    // It used to default to 5 with a `||`, which was wrong twice over. A window only ever reaches AWS for a
    // queue that sets `batchSize > 0` (the CDK construct omits both together otherwise), and in practice
    // those queues all use batchSize 1 — where a batch is FULL on the first message, so a window can never
    // gather a second one and can only delay the first. And `||` meant 0 was falsy, so a caller who noticed
    // and passed 0 still got 5: the setting could not be turned off at all.
    //
    // A queue that genuinely wants to accumulate should ask for a window explicitly, rather than every
    // queue inheriting latency that most of them cannot use.
    batchWindowInSeconds: options?.batchWindowInSeconds ?? 0,

    concurrency: options?.concurrency || 1,

    maxTries: options?.maxTries || 1,
    ttRetryInSeconds: Math.min(options?.ttRetryInSeconds || 15 * 60, 15 * 60),

    hasDeadLetterQueue: options?.hasDeadLetterQueue ?? true,

    qpqQueueProcessors: processors,

    eventBusSubscriptions: options?.eventBusSubscriptions || [],

    maxConcurrentExecutions: options?.maxConcurrentExecutions,

    isFifo: options?.isFifo || false,
  };
};
