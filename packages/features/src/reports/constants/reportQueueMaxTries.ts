/** Deliveries before a message goes to the dead letter queue: a write that loses a race is retried, not dropped. */
export const REPORT_QUEUE_MAX_TRIES = 5;
