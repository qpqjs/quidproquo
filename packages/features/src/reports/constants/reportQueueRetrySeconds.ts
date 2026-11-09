/** Seconds before a failed message is retried. Short, because a FIFO group waits on it and holds back that tenant's counts. */
export const REPORT_QUEUE_RETRY_SECONDS = 30;
