/** Retry bounds for the append slot race: a losing lap re-reads the head and re-validates; the wait spreads simultaneous losers out. */
export const EVENT_DOC_APPEND_MAX_RETRIES = 8;
export const EVENT_DOC_APPEND_RETRY_BASE_WAIT_MS = 20;
export const EVENT_DOC_APPEND_RETRY_MAX_JITTER_MS = 40;
