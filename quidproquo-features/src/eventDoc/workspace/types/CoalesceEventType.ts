/**
 * A last-write-wins rule. A bare type string keeps one pending event per type; `{ type, key }` keeps one per data[key] value,
 * so editing one list item does not clobber another item's pending edit.
 */
export type CoalesceEventType = string | { type: string; key: string };
