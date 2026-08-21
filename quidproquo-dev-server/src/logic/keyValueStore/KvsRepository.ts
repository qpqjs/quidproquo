import { KvsQueryOperation, KvsUpdate, Nullable, QpqPagedData } from 'quidproquo-core';

/**
 * One entry of an upsertMany result: the item as written, and the row it
 * replaced (null when the write was an insert), so the caller can emit
 * Insert/Modify stream events without re-reading.
 */
export type KvsUpsertManyResult = {
  item: any;
  oldItem: Nullable<any>;
};

/**
 * Public surface shared by every KVS storage engine (sqlite, json, ...) so the
 * action processors and the contract test suite depend on the interface, not a
 * concrete implementation.
 *
 * `scope` partitions a store per tenant; how is the engine's business. The
 * contract is that scoped data is invisible to every other scope and to
 * unscoped access, with no composed key values leaking out. Undefined means
 * the unscoped (Personal) partition.
 *
 * Writes are durable once the returned promise resolves - there is no flush
 * on this interface. An engine that buffers internally must still make writes
 * visible to another repository over the same runtime path immediately (see
 * the contract suite's cross-instance and durability blocks).
 */
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

  // Every scope this store currently holds data for, unscoped excluded (the
  // caller adds it). Migration-only: see askKeyValueStoreScanAllScopes.
  listScopes(keyValueStoreName: string): Promise<string[]>;

  upsert(keyValueStoreName: string, item: any, options?: { ifNotExists?: boolean }, scope?: string): Promise<any>;

  // Write the whole batch as one unit: on an engine with transactions all
  // items commit together, and the caller gets back what each write replaced.
  // Unconditional, like BatchWriteItem; the caller validates the batch first.
  upsertMany(keyValueStoreName: string, items: any[], scope?: string): Promise<KvsUpsertManyResult[]>;

  update(keyValueStoreName: string, key: string, sortKey: string | undefined, updates: KvsUpdate, scope?: string): Promise<any>;

  delete(keyValueStoreName: string, key: string, scope?: string): Promise<boolean>;

  close(): Promise<void>;
}
