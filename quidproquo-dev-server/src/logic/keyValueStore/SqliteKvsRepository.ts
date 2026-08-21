import {
  KeyValueStoreQPQConfigSetting,
  KvsQueryOperation,
  KvsUpdate,
  Nullable,
  QPQConfig,
  QpqPagedData,
  resolveKvsStoreConfigOrThrow,
} from 'quidproquo-core';

import { DatabaseSync } from 'node:sqlite';

import { applyUpdateToItem } from './applyKvsUpdates';
import { buildKvsKeyNarrowing } from './buildKvsKeyNarrowing';
import { coerceKvsKeyValue } from './coerceKvsKeyValue';
import { ConditionalCheckFailedException } from './ConditionalCheckFailedException';
import { ensureKvsTable } from './ensureKvsTable';
import { evaluateKvsQueryOperation, validateKvsQueryOperation } from './evaluateKvsQueryOperation';
import { getKvsItemPk } from './getKvsItemPk';
import { getKvsItemSk } from './getKvsItemSk';
import { getKvsTableName } from './getKvsTableName';
import { decodeKvsPageCursor, encodeKvsPageCursor } from './kvsPageCursor';
import { KvsRepository, KvsUpsertManyResult } from './KvsRepository';
import { openKvsDatabase } from './openKvsDatabase';
import { quoteSqlIdentifier } from './quoteSqlIdentifier';
import { splitKvsCompositeKey } from './splitKvsCompositeKey';

// Everything a method needs to talk to a store's table.
type KvsStoreAccess = {
  storeConfig: KeyValueStoreQPQConfigSetting;
  // Quoted identifier, ready to interpolate into SQL.
  table: string;
  hasSortKey: boolean;
};

/**
 * KVS repository on node:sqlite (built into node, no native deps).
 *
 * One WAL-mode db file for the whole runtime, one table per store namespaced
 * by owner module, scope as a primary-key column. Writes are durable at the
 * statement and visible to every other repository instance immediately - no
 * flush, no debounce, no per-process cache to go stale.
 *
 * Items are stored as raw JSON in `data`; pk/sk are duplicated into their own
 * untyped columns only so the primary key can address and order rows. Query
 * semantics stay in evaluateKvsQueryOperation - SQL narrows, orders and pages,
 * nothing more (see buildKvsKeyNarrowing).
 */
export class SqliteKvsRepository implements KvsRepository {
  private db: DatabaseSync;
  private ensuredTables = new Set<string>();
  private inTransaction = false;
  private closed = false;

  constructor(
    runtimePath: string,
    private qpqConfig: QPQConfig,
  ) {
    this.db = openKvsDatabase(runtimePath);
  }

  private accessStore(keyValueStoreName: string): KvsStoreAccess {
    const storeConfig = resolveKvsStoreConfigOrThrow(this.qpqConfig, keyValueStoreName);
    const tableName = getKvsTableName(this.qpqConfig, storeConfig, keyValueStoreName);

    if (!this.ensuredTables.has(tableName)) {
      ensureKvsTable(this.db, tableName, storeConfig);
      this.ensuredTables.add(tableName);
    }

    return { storeConfig, table: quoteSqlIdentifier(tableName), hasSortKey: storeConfig.sortKeys.length > 0 };
  }

  // Nothing inside `work` may await. All services share this process, so a
  // handle blocked on a held write lock would starve the event loop the lock
  // holder needs to finish (busy_timeout only helps across processes);
  // synchronous bodies rule that out. Re-entrant, so replaceRow's transaction
  // composes with update's and upsertMany's.
  private runInImmediateTransaction<T>(work: () => T): T {
    if (this.inTransaction) {
      return work();
    }

    this.db.exec('BEGIN IMMEDIATE');
    this.inTransaction = true;
    try {
      const result = work();
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    } finally {
      this.inTransaction = false;
    }
  }

  // The split key coerced to the declared column types, ready to bind. sk is
  // null for a bare key; lookups bind it with `IS ?` so a bare key still
  // addresses the row stored without a sort key value.
  private toKeyBindValues(key: string, storeConfig: KeyValueStoreQPQConfigSetting): { pk: string | number; sk: Nullable<string | number> } {
    const parts = splitKvsCompositeKey(key, storeConfig);
    return {
      pk: coerceKvsKeyValue(parts.pk, storeConfig.partitionKey.type),
      sk: parts.sk === null ? null : coerceKvsKeyValue(parts.sk, storeConfig.sortKeys[0].type),
    };
  }

  // Write one row, replacing whatever the primary key already held. The
  // NULL-sk branch exists because NULLs never compare equal in a unique index,
  // so INSERT OR REPLACE can't see the row it should replace; deleting it by
  // hand inside a transaction keeps such rows singular. (An item without its
  // sort key value is dynamo-illegal, but the json engine tolerated it.)
  private replaceRow(access: KvsStoreAccess, scopeValue: string, pk: unknown, sk: unknown, data: string): void {
    if (!access.hasSortKey) {
      this.db.prepare(`INSERT OR REPLACE INTO ${access.table} (scope, pk, data) VALUES (?, ?, ?)`).run(scopeValue, pk as any, data);
      return;
    }

    if (sk === null || sk === undefined) {
      this.runInImmediateTransaction(() => {
        this.db.prepare(`DELETE FROM ${access.table} WHERE scope = ? AND pk = ? AND sk IS NULL`).run(scopeValue, pk as any);
        this.db.prepare(`INSERT INTO ${access.table} (scope, pk, sk, data) VALUES (?, ?, NULL, ?)`).run(scopeValue, pk as any, data);
      });
      return;
    }

    this.db.prepare(`INSERT OR REPLACE INTO ${access.table} (scope, pk, sk, data) VALUES (?, ?, ?, ?)`).run(scopeValue, pk as any, sk as any, data);
  }

  private selectRowData(access: KvsStoreAccess, scopeValue: string, pk: string | number, sk: Nullable<string | number>): Nullable<string> {
    const sql = access.hasSortKey
      ? `SELECT data FROM ${access.table} WHERE scope = ? AND pk = ? AND sk IS ?`
      : `SELECT data FROM ${access.table} WHERE scope = ? AND pk = ?`;
    const bindValues = access.hasSortKey ? [scopeValue, pk, sk] : [scopeValue, pk];

    const row = this.db.prepare(sql).get(...(bindValues as any[])) as { data: string } | undefined;
    return row?.data ?? null;
  }

  async get(keyValueStoreName: string, key: string, scope?: string): Promise<any | null> {
    const access = this.accessStore(keyValueStoreName);
    const scopeValue = scope ?? '';
    const { pk, sk } = this.toKeyBindValues(key, access.storeConfig);

    const data = this.selectRowData(access, scopeValue, pk, sk);
    if (data !== null) {
      return JSON.parse(data);
    }

    // A pk value containing '#' mis-splits above (see splitKvsCompositeKey);
    // matching the stored concatenation covers it. Miss path only, so the
    // indexed lookup stays the fast path.
    if (access.hasSortKey && key.split('#').length > 2) {
      const row = this.db.prepare(`SELECT data FROM ${access.table} WHERE scope = ? AND pk || '#' || sk = ?`).get(scopeValue, key) as
        { data: string } | undefined;
      if (row) {
        return JSON.parse(row.data);
      }
    }

    return null;
  }

  async query(
    keyValueStoreName: string,
    keyCondition: KvsQueryOperation,
    filter?: KvsQueryOperation,
    nextPageKey?: string,
    _indexName?: string,
    limit?: number,
    sortAscending: boolean = true,
    scope?: string,
  ): Promise<QpqPagedData<any>> {
    const access = this.accessStore(keyValueStoreName);

    validateKvsQueryOperation(keyCondition);
    if (filter) {
      validateKvsQueryOperation(filter);
    }

    return this.readPage(access, scope ?? '', keyCondition, filter, nextPageKey, limit, sortAscending);
  }

  async scan(
    keyValueStoreName: string,
    filter?: KvsQueryOperation,
    nextPageKey?: string,
    limit?: number,
    scope?: string,
  ): Promise<QpqPagedData<any>> {
    const access = this.accessStore(keyValueStoreName);

    if (filter) {
      validateKvsQueryOperation(filter);
    }

    return this.readPage(access, scope ?? '', undefined, filter, nextPageKey, limit, true);
  }

  // Shared read path for query and scan. SQL narrows, orders by (pk, sk) and
  // streams rows out; JS re-evaluates the full condition and counts the page
  // off rows that survive filtering, so a filter can't truncate a page early.
  // One extra matching row is enough to know hasMore.
  private readPage(
    access: KvsStoreAccess,
    scopeValue: string,
    keyCondition: KvsQueryOperation | undefined,
    filter: KvsQueryOperation | undefined,
    nextPageKey: string | undefined,
    limit: number | undefined,
    sortAscending: boolean,
  ): QpqPagedData<any> {
    const whereClauses = ['scope = ?'];
    const bindValues: (string | number)[] = [scopeValue];

    if (keyCondition) {
      const narrowing = buildKvsKeyNarrowing(keyCondition, access.storeConfig);
      whereClauses.push(narrowing.sql);
      bindValues.push(...narrowing.params);
    }

    if (nextPageKey) {
      const cursor = decodeKvsPageCursor(nextPageKey);
      const comparison = sortAscending ? '>' : '<';
      if (access.hasSortKey) {
        whereClauses.push(`(pk ${comparison} ? OR (pk = ? AND sk ${comparison} ?))`);
        bindValues.push(cursor.pk, cursor.pk, cursor.sk);
      } else {
        whereClauses.push(`pk ${comparison} ?`);
        bindValues.push(cursor.pk);
      }
    }

    const direction = sortAscending ? 'ASC' : 'DESC';
    const orderBy = access.hasSortKey ? `pk ${direction}, sk ${direction}` : `pk ${direction}`;
    const sql = `SELECT data FROM ${access.table} WHERE ${whereClauses.join(' AND ')} ORDER BY ${orderBy}`;

    const pageSize = limit || 100;
    const pageItems: any[] = [];
    let hasMore = false;

    for (const row of this.db.prepare(sql).iterate(...(bindValues as any[]))) {
      const item = JSON.parse((row as { data: string }).data);

      if (keyCondition && !evaluateKvsQueryOperation(item, keyCondition, access.storeConfig)) {
        continue;
      }
      if (filter && !evaluateKvsQueryOperation(item, filter, access.storeConfig)) {
        continue;
      }

      if (pageItems.length === pageSize) {
        hasMore = true;
        break;
      }
      pageItems.push(item);
    }

    return {
      items: pageItems,
      nextPageKey: hasMore ? encodeKvsPageCursor(pageItems[pageItems.length - 1], access.storeConfig) : undefined,
    };
  }

  async getAll(keyValueStoreName: string, scope?: string): Promise<any[]> {
    const access = this.accessStore(keyValueStoreName);
    const orderBy = access.hasSortKey ? 'pk, sk' : 'pk';

    const rows = this.db.prepare(`SELECT data FROM ${access.table} WHERE scope = ? ORDER BY ${orderBy}`).all(scope ?? '') as { data: string }[];
    return rows.map((row) => JSON.parse(row.data));
  }

  async listScopes(keyValueStoreName: string): Promise<string[]> {
    const access = this.accessStore(keyValueStoreName);

    const rows = this.db.prepare(`SELECT DISTINCT scope FROM ${access.table} WHERE scope <> '' ORDER BY scope`).all() as { scope: string }[];
    return rows.map((row) => row.scope);
  }

  async upsert(keyValueStoreName: string, item: any, options?: { ifNotExists?: boolean }, scope?: string): Promise<any> {
    const access = this.accessStore(keyValueStoreName);
    const scopeValue = scope ?? '';
    const pk = getKvsItemPk(item, access.storeConfig) ?? null;
    const sk = getKvsItemSk(item, access.storeConfig) ?? null;
    const data = JSON.stringify(item);

    if (options?.ifNotExists) {
      // OR IGNORE swallows exactly a primary key conflict, and changes === 0
      // is how sqlite reports one - an atomic compare-and-set.
      const columns = access.hasSortKey ? '(scope, pk, sk, data)' : '(scope, pk, data)';
      const placeholders = access.hasSortKey ? '(?, ?, ?, ?)' : '(?, ?, ?)';
      const insertValues = access.hasSortKey ? [scopeValue, pk, sk, data] : [scopeValue, pk, data];

      const result = this.db.prepare(`INSERT OR IGNORE INTO ${access.table} ${columns} VALUES ${placeholders}`).run(...(insertValues as any[]));
      if (Number(result.changes) === 0) {
        throw new ConditionalCheckFailedException(`KVS item already exists in '${keyValueStoreName}'`);
      }
      return item;
    }

    this.replaceRow(access, scopeValue, pk, sk, data);
    return item;
  }

  async upsertMany(keyValueStoreName: string, items: any[], scope?: string): Promise<KvsUpsertManyResult[]> {
    const access = this.accessStore(keyValueStoreName);
    const scopeValue = scope ?? '';

    // One transaction for the whole batch: one WAL commit instead of one per
    // item, and a failure part-way writes nothing. The per-item SELECT tells
    // an insert from a modify for the caller's stream events. No awaits
    // inside: see runInImmediateTransaction.
    return this.runInImmediateTransaction(() =>
      items.map((item) => {
        const pk = getKvsItemPk(item, access.storeConfig) ?? null;
        const sk = getKvsItemSk(item, access.storeConfig) ?? null;

        const previousData = this.selectRowData(access, scopeValue, pk, sk);
        this.replaceRow(access, scopeValue, pk, sk, JSON.stringify(item));

        return { item, oldItem: previousData === null ? null : JSON.parse(previousData) };
      }),
    );
  }

  async update(keyValueStoreName: string, key: string, sortKey: string | undefined, updates: KvsUpdate, scope?: string): Promise<any> {
    const access = this.accessStore(keyValueStoreName);
    const scopeValue = scope ?? '';

    const pk = coerceKvsKeyValue(key, access.storeConfig.partitionKey.type);
    const sk = access.hasSortKey && sortKey !== undefined ? coerceKvsKeyValue(sortKey, access.storeConfig.sortKeys[0].type) : null;

    // Read-modify-write in one transaction so concurrent updates to a row
    // serialize instead of clobbering each other. No awaits inside: see
    // runInImmediateTransaction.
    return this.runInImmediateTransaction(() => {
      const existingData = this.selectRowData(access, scopeValue, pk, sk);

      // A missing row updates a base item holding just the keys, like dynamo's
      // UpdateItem.
      const currentItem = existingData
        ? JSON.parse(existingData)
        : {
            [access.storeConfig.partitionKey.key]: pk,
            ...(access.hasSortKey && sortKey !== undefined ? { [access.storeConfig.sortKeys[0].key]: sk } : {}),
          };

      const updatedItem = applyUpdateToItem(currentItem, updates);

      // Written under the addressed key, not any key attribute the update may
      // have rewritten inside the item - the storage key stays fixed.
      this.replaceRow(access, scopeValue, pk, sk, JSON.stringify(updatedItem));

      return updatedItem;
    });
  }

  async delete(keyValueStoreName: string, key: string, scope?: string): Promise<boolean> {
    const access = this.accessStore(keyValueStoreName);
    const scopeValue = scope ?? '';
    const { pk, sk } = this.toKeyBindValues(key, access.storeConfig);

    const sql = access.hasSortKey
      ? `DELETE FROM ${access.table} WHERE scope = ? AND pk = ? AND sk IS ?`
      : `DELETE FROM ${access.table} WHERE scope = ? AND pk = ?`;
    const bindValues = access.hasSortKey ? [scopeValue, pk, sk] : [scopeValue, pk];

    const result = this.db.prepare(sql).run(...(bindValues as any[]));
    if (Number(result.changes) > 0) {
      return true;
    }

    // Same '#'-in-pk fallback as get.
    if (access.hasSortKey && key.split('#').length > 2) {
      const fallback = this.db.prepare(`DELETE FROM ${access.table} WHERE scope = ? AND pk || '#' || sk = ?`).run(scopeValue, key);
      return Number(fallback.changes) > 0;
    }

    return false;
  }

  async close(): Promise<void> {
    if (this.closed) {
      return;
    }
    this.closed = true;
    // Checkpoints the WAL, folding kvs.db-wal back into kvs.db.
    this.db.close();
  }
}
