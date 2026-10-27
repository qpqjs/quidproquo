// A row as it is stored. Any value can be written, but a row must be keyed by name:
// the store's partition and sort keys are looked up as properties of the item.
export type KvsItemRecord = Record<string, any>;
