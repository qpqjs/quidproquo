import { QPQConfigAdvancedSettings } from '../../../QPQConfig';

export type QPQConfigAdvancedQueueSettings = {
  batchSize?: number;
  batchWindowInSeconds?: number;
  concurrency?: number;
  /**
   * How many times a message is tried before it goes to the dead letter queue. Default 5. A try is
   * used up when the handler fails, and also when the provider hands the message over but cannot
   * run the consumer (one capped with `maxConcurrentExecutions` that is already busy, say), so a
   * queue with a single try can lose a message its handler never saw. A handler on a queue with
   * more than one try must be safe to run again for the same message.
   */
  maxTries?: number;
  /**
   * How long a message waits before its next try, in seconds. Default 15 minutes. It is also how
   * long the consumer may run for one message (up to the platform's ceiling), so it cannot be
   * shorter than the slowest message takes.
   */
  ttRetryInSeconds?: number;
  hasDeadLetterQueue?: boolean;
  eventBusSubscriptions?: string[];
  /**
   * The most consumers that may run at once. A message that arrives while they are all busy is not
   * lost, but it uses up one of its tries and waits `ttRetryInSeconds` for the next.
   */
  maxConcurrentExecutions?: number;
  isFifo?: boolean;
} & QPQConfigAdvancedSettings;
