/** Largest single value (serialised JSON bytes) carried inline in an event. Real values are tiny (p95 under 30 bytes). */
export const EVENT_DOC_VALUE_INLINE_MAX_BYTES = 4 * 1024;

/**
 * Total inline budget for one event across every value it records. Appends do not validate, so an oversized event is
 * written and then silently rejected by the validator on every fold. Anything over budget falls back to an asset.
 */
export const EVENT_DOC_EVENT_INLINE_BUDGET_BYTES = 32 * 1024;
