/**
 * How many messages the busy queue test sends at once. One runs and the rest find the consumer
 * busy. Fewer than a queue's default tries, so even if only one message gets through per round
 * the last one still has a try left.
 */
export const SMOKE_BUSY_QUEUE_BURST_SIZE = 4;
