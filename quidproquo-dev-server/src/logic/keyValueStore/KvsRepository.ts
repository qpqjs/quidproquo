import { KvsQueryOperation, KvsUpdate, Nullable, QpqPagedData } from 'quidproquo-core';

// One entry of an upsertMany result: the item as written, and the row it
// replaced (null when the write was an insert). Carrying the old row out lets
// the caller emit honest Insert/Modify stream events without a second read.
export type KvsUpsertManyResult = {
  item: any;
  oldItem: Nullable<any>;
};

// Public surface shared by every KVS storage engine (sqlite, json, ...) so the
// action processors and the contract test suite can depend on the interface
// instead of a concrete implementation.
//
// `scope` partitions a store per tenant: each scope gets its own on-disk file
// (`kvs/<service>/<scope>/<store>.json`), so scoped data is isolated by the
// file boundary and stays human-readable - no composed key values. Undefined
// means the unscoped (Personal) partition.
export interface KvsRepository {
  get(keyValueStoreName: string, key: string, scope?: string): Promise<any | null>;

  query(
    keyValueStoreName: string,
    keyCondition: KvsQueryOperation,
    filter?: KvsQueryOperation,
    nextPageKey?: string,
    indexName?: string,
    limit?: number,
    sortAscending?: boolean,
    scope?: string,
  ): Promise<QpqPagedData<any>>;

  scan(keyValueStoreName: string, filter?: KvsQueryOperation, nextPageKey?: string, limit?: number, scope?: string): Promise<QpqPagedData<any>>;

  getAll(keyValueStoreName: string, scope?: string): Promise<any[]>;

  // Every scope this store currently holds data for, unscoped excluded (the caller adds it).
  // Scopes are folders on disk, so this is a directory listing rather than anything derived
  // from the data. Migration-only: see askKeyValueStoreScanAllScopes.
  listScopes(keyValueStoreName: string): Promise<string[]>;

  // Write out anything still buffered, and wait for it to hit disk.
  //
  // Writes are debounced and their timer is unref'd, so a short-lived process (a one-shot
  // `qpq migrate`, say) can finish its work and exit with everything it "wrote" still sitting
  // in memory. Long-running callers never notice; a command that exits has to ask.
  flushAll(): Promise<void>;

  upsert(keyValueStoreName: string, item: any, options?: { ifNotExists?: boolean }, scope?: string): Promise<any>;

  // Write the whole batch as ONE unit: on an engine with transactions all items
  // commit together (a 25-item batch is one commit, not 25), and on any engine
  // the caller gets back what each write replaced. Unconditional, like
  // DynamoDB's BatchWriteItem; the caller validates the batch before calling.
  upsertMany(keyValueStoreName: string, items: any[], scope?: string): Promise<KvsUpsertManyResult[]>;

  update(keyValueStoreName: string, key: string, sortKey: string | undefined, updates: KvsUpdate, scope?: string): Promise<any>;

  delete(keyValueStoreName: string, key: string, scope?: string): Promise<boolean>;

  close(): Promise<void>;
}
