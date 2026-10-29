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
    // Default 0 (invoke as soon as a message arrives), which is also AWS's own default for
    // MaximumBatchingWindowInSeconds. A window only reaches AWS for a queue with batchSize > 0, and those
    // queues use batchSize 1, where a batch is full on the first message, so a window can only delay it.
    // `??` rather than `||` so an explicit 0 is honoured. A queue that wants to accumulate asks for a window
    // explicitly instead of every queue inheriting latency it cannot use.
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
