// One change to a key-value store item, delivered by the store's stream (see
// defineKeyValueStore's `onStream`).
//
// The images are plain objects, not the storage layer's wire format: the action processor
// unmarshals them, so a stream handler is ordinary story code and never sees a DynamoDB
// AttributeValue. That also keeps handlers portable to a non-DynamoDB store.
export enum KvsStreamEventType {
  Insert = 'Insert',
  Modify = 'Modify',
  Remove = 'Remove',
}

export type KvsStreamRecord<TItem extends object = any> = {
  keyValueStoreName: string;

  eventType: KvsStreamEventType;

  // The storage scope the item was written under; absent for an unscoped row.
  //
  // Scope is composed INTO the partition key value on the way to storage, so the raw stored
  // key carries it. Every other read path hides that (the scoped translator strips it before
  // a consumer ever sees it), and a stream record is the one place it would otherwise leak.
  // Handing it back as its own field keeps that promise: a consumer re-enters the scope by
  // reading this, instead of having to know the composition format and remember to undo it.
  // Forgetting to would mean acting on one tenant's data while pointed at another's.
  scope?: string;

  // The item's key attributes only — always present, including on Remove. RAW: the scope has
  // been stripped back out of the partition key, so these are the values the caller wrote.
  keys: Record<string, unknown>;

  // The item after the change, scope stripped like `keys`. Absent on Remove.
  newImage?: TItem;

  // The item before the change, scope stripped like `keys`. Absent on Insert.
  oldImage?: TItem;
};

// Handlers are invoked per record, mirroring how storage drive and queue events are
// dispatched. Ordering is guaranteed per partition key; records for different partition
// keys may be processed concurrently.
export type KvsStreamEventResponse = void;
