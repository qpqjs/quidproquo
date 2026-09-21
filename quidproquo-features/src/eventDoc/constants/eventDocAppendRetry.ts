/**
 * Retry bounds for the append slot race: a losing lap re-reads the head and re-validates; the wait spreads simultaneous losers out.
 * A lost lap costs one consistent read and one failed conditional write, so the cap is generous: with n writers racing one
 * document the unluckiest loses up to n-1 laps, and giving up is worse than waiting (the caller's queue redelivers seconds later,
 * or a request fails outright). The linear backoff sums to about four seconds at the cap.
 */
export const EVENT_DOC_APPEND_MAX_RETRIES = 20;
export const EVENT_DOC_APPEND_RETRY_BASE_WAIT_MS = 20;
export const EVENT_DOC_APPEND_RETRY_MAX_JITTER_MS = 40;
