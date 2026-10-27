/**
 * Largest folded state (serialised JSON bytes) stored inline on a snapshot row; anything bigger goes to the collection's blob drive.
 * Leaves headroom under DynamoDB's 400KB item limit, which is measured on the whole marshalled item.
 */
export const EVENT_DOC_SNAPSHOT_INLINE_MAX_BYTES = 300 * 1024;
