/** How long a failed reproject message waits before its next try. Short: reprojecting is idempotent, so nothing is gained by waiting. */
export const EVENT_DOC_REPROJECT_QUEUE_RETRY_SECONDS = 30;
