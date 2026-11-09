/**
 * The id of the month document for an event type and local month (`YYYY-MM`), derived so the consumer and the read find
 * it without a lookup. `~` never appears in an event type, so the id cannot be ambiguous, and it holds no `/` or `#` for
 * blob paths and keys.
 */
export const reportMonthDocId = (type: string, month: string): string => `${type}~${month}`;
