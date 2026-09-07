// Optimistic-concurrency bounds for the append slot race (askEventDocEventAppend and
// askEventDocAppendServerEvents). A losing lap re-reads the head and re-validates, so
// each retry is cheap; the wait exists only to spread simultaneous losers out. Sustained
// losing past the cap means something is hammering one document — fail rather than spin.
export const EVENT_DOC_APPEND_MAX_RETRIES = 8;
export const EVENT_DOC_APPEND_RETRY_BASE_WAIT_MS = 20;
export const EVENT_DOC_APPEND_RETRY_MAX_JITTER_MS = 40;
