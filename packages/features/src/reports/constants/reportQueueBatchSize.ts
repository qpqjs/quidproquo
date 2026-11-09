/**
 * Messages per consumer invocation: the most a FIFO queue allows. It must not exceed EVENT_DOC_RECENT_CLIENT_MESSAGE_ID_WINDOW,
 * so every message of a batch SQS redelivers is still in the month document's dedup window.
 */
export const REPORT_QUEUE_BATCH_SIZE = 10;
