import { QPQCoreConfigSettingType } from '../../QPQConfig';
import { QPQConfigAdvancedQueueSettings, QpqQueueProcessors, QueueQPQConfigSetting } from './types';

// How long a failed message waits before its next try unless the queue says otherwise.
const DEFAULT_RETRY_DELAY_IN_SECONDS = 15 * 60;

export const defineQueue = (name: string, processors: QpqQueueProcessors, options?: QPQConfigAdvancedQueueSettings): QueueQPQConfigSetting => {
  return {
    configSettingType: QPQCoreConfigSettingType.queue,
    uniqueKey: name,

    name,

    batchSize: options?.batchSize ?? 0,
    // Default 0 (invoke as soon as a message arrives), which is also AWS's own default for
    // MaximumBatchingWindowInSeconds. A window only reaches AWS for a queue with batchSize > 0, and those
    // queues use batchSize 1, where a batch is full on the first message, so a window can only delay it.
    // `??` rather than `||` so an explicit 0 is honoured. A queue that wants to accumulate asks for a window
    // explicitly instead of every queue inheriting latency it cannot use.
    batchWindowInSeconds: options?.batchWindowInSeconds ?? 0,

    concurrency: options?.concurrency ?? 1,

    maxTries: options?.maxTries ?? 1,
    ttRetryInSeconds: options?.ttRetryInSeconds ?? DEFAULT_RETRY_DELAY_IN_SECONDS,

    hasDeadLetterQueue: options?.hasDeadLetterQueue ?? true,

    qpqQueueProcessors: processors,

    eventBusSubscriptions: options?.eventBusSubscriptions ?? [],

    maxConcurrentExecutions: options?.maxConcurrentExecutions,

    isFifo: options?.isFifo ?? false,
  };
};
