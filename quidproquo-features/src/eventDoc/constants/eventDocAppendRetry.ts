/**
 * Retry bounds for the append slot race: a losing lap re-reads the head and re-validates; the wait spreads simultaneous losers out.
 * A lost lap costs one consistent read and one failed conditional write, so the cap is generous: with n writers racing one
 * document the unluckiest loses at least n-1 laps, and transactional batches can cancel each other so it loses more. Giving up
 * is worse than waiting: a queue with maxTries 1 never redelivers, so the event is simply lost. The linear backoff sums to about
 * sixteen seconds at the cap, only ever reached under sustained contention on one document.
 */
export const EVENT_DOC_APPEND_MAX_RETRIES = 40;
export const EVENT_DOC_APPEND_RETRY_BASE_WAIT_MS = 20;
export const EVENT_DOC_APPEND_RETRY_MAX_JITTER_MS = 40;
