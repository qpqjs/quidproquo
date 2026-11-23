/**
 * How long a message the busy queue's consumer could not take waits before its next try. Longer
 * than the consumer holds one message (it is also the consumer's time limit), short enough that
 * the whole burst is through well inside the test's wait.
 */
export const SMOKE_BUSY_QUEUE_RETRY_SECONDS = 15;
