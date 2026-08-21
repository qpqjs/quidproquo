import {
  KeyValueStoreQPQConfigSetting,
  KvsQueryOperation,
  KvsStoreNotFoundError,
  KvsUpdate,
  QPQConfig,
  qpqCoreUtils,
  QpqPagedData,
} from 'quidproquo-core';

import * as fs from 'fs';
import * as path from 'path';
import { StringDecoder } from 'string_decoder';

import { applyUpdateToItem } from './applyKvsUpdates';
import { evaluateKvsQueryOperation, validateKvsQueryOperation } from './evaluateKvsQueryOperation';
import { KvsRepository, KvsUpsertManyResult } from './KvsRepository';
import { getKvsItemPk } from './getKvsItemPk';
import { getKvsItemSk } from './getKvsItemSk';
import { compareKvsItemKeys, paginateKvsItems } from './paginateKvsItems';

interface KvsStoreState {
  keyValueStoreName: string;
  scope?: string;
  items: Map<string, any>;
  dirty: boolean;
  flushTimer: NodeJS.Timeout | null;
  // Resolves once the currently-running write (and any write it coalesced in
  // while running) has finished; null when no flush is in flight.
  flushPromise: Promise<void> | null;
  // Set when a mutation lands while a flush is already running for this store,
  // so that flush re-runs once more after the current write completes.
  flushAgain: boolean;
}

const FLUSH_DEBOUNCE_MS = 100;

interface KvsStoreFile {
  items: any[];
}

// In-memory KVS repository backed by one JSON file per store on disk, replacing
// SqliteKvsRepository. Single Node process assumption: this class holds the
// sole in-process copy of every store's data (see getKvsRepository.ts, which
// guarantees one instance per service), and relies on that - there is no
// cross-process locking the way sqlite's WAL mode provided.
//
// A scope (tenant) partitions a store into its own file under a scope folder
// (`kvs/<service>/<scope>/<store>.json`), keeping the on-disk runtime state
// human-readable per tenant. The scope is validated by the action processors
// before it reaches here (it becomes a folder name).
export class JsonKvsRepository implements KvsRepository {
  private stores = new Map<string, KvsStoreState>();

  constructor(
    private runtimePath: string,
    private qpqConfig: QPQConfig,
  ) {}

  private getStoreConfig(keyValueStoreName: string): KeyValueStoreQPQConfigSetting {
    const storeConfig = qpqCoreUtils.getKeyValueStoreByName(this.qpqConfig, keyValueStoreName);
    if (!storeConfig) {
      throw new KvsStoreNotFoundError(keyValueStoreName);
    }
    return storeConfig;
  }

  private getStoreFilePath(keyValueStoreName: string, storeConfig: KeyValueStoreQPQConfigSetting, scope?: string): string {
    const serviceName = storeConfig.owner?.module ?? qpqCoreUtils.getApplicationModuleName(this.qpqConfig);
    return scope
      ? path.join(this.runtimePath, 'kvs', serviceName, scope, `${keyValueStoreName}.json`)
      : path.join(this.runtimePath, 'kvs', serviceName, `${keyValueStoreName}.json`);
  }

  // A scope is a folder under `kvs/<service>/`, and a scope "has" this store if the folder
  // holds its json file. Reading the directory rather than tracking scopes anywhere keeps
  // this honest even when files are added by hand, which happens plenty in local dev.
  async listScopes(keyValueStoreName: string): Promise<string[]> {
    const storeConfig = this.getStoreConfig(keyValueStoreName);
    const serviceName = qpqCoreUtils.getApplicationModuleName(this.qpqConfig);
    const serviceRoot = path.join(this.runtimePath, 'kvs', serviceName);

    if (!fs.existsSync(serviceRoot)) {
      return [];
    }

    return fs
      .readdirSync(serviceRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((scope) => fs.existsSync(this.getStoreFilePath(keyValueStoreName, storeConfig, scope)));
  }

  private buildStorageKey(item: any, storeConfig: KeyValueStoreQPQConfigSetting): string {
    const pk = getKvsItemPk(item, storeConfig);
    const sk = getKvsItemSk(item, storeConfig);
    return sk === null ? String(pk) : `${pk}#${sk}`;
  }

  private parseStoreFile(raw: string, filePath: string): KvsStoreFile {
    try {
      return JSON.parse(raw);
    } catch (error: any) {
      throw new Error(`Invalid JSON in KVS store file '${filePath}': ${error.message}`);
    }
  }

  // Chunked, line-by-line read of a store file too large for one readFileSync string —
  // the read-side twin of writeStoreFile's streamed serialization (V8 caps strings at
  // ~512MB, and readFileSync returns ONE string). Only ever invoked for files past that
  // scale, and any file that large was necessarily written by the streamed writer, so the
  // one-row-per-line layout can be assumed: every line that opens a JSON object is one
  // item (trailing comma trimmed); the wrapper lines ('{', '"items": [', ']', '}') carry
  // no data. Synchronous on purpose - getStore is the lazy first-touch load and every
  // caller reaches it synchronously.
  private readLargeStoreFileItems(filePath: string): any[] {
    const READ_CHUNK_BYTES = 8 * 1024 * 1024;

    const items: any[] = [];
    const buffer = Buffer.alloc(READ_CHUNK_BYTES);
    // Chunk boundaries can split a multi-byte UTF-8 character; the decoder carries the
    // partial sequence across reads.
    const decoder = new StringDecoder('utf8');
    const fd = fs.openSync(filePath, 'r');

    const parseLine = (line: string): void => {
      const trimmed = line.trim();
      if (!trimmed.startsWith('{') || trimmed === '{') {
        return;
      }

      const rowJson = trimmed.endsWith(',') ? trimmed.slice(0, -1) : trimmed;

      try {
        items.push(JSON.parse(rowJson));
      } catch (error: any) {
        throw new Error(`Invalid JSON row in large KVS store file '${filePath}': ${error.message}`);
      }
    };

    try {
      let remainder = '';

      for (;;) {
        const bytesRead = fs.readSync(fd, buffer, 0, READ_CHUNK_BYTES, null);
        if (bytesRead === 0) {
          break;
        }

        const text = remainder + decoder.write(buffer.subarray(0, bytesRead));
        const lines = text.split('\n');
        remainder = lines.pop() ?? '';

        for (const line of lines) {
          parseLine(line);
        }
      }

      parseLine(remainder + decoder.end());
    } finally {
      fs.closeSync(fd);
    }

    return items;
  }

  private getStore(keyValueStoreName: string, storeConfig: KeyValueStoreQPQConfigSetting, scope?: string): KvsStoreState {
    // Scope can never contain '/' (validated upstream), so this key is unambiguous.
    const stateKey = scope ? `${scope}/${keyValueStoreName}` : keyValueStoreName;

    const existing = this.stores.get(stateKey);
    if (existing) {
      return existing;
    }

    const filePath = this.getStoreFilePath(keyValueStoreName, storeConfig, scope);
    const items = new Map<string, any>();

    if (fs.existsSync(filePath)) {
      // Files past readFileSync's single-string ceiling (~512MB) take the chunked
      // line reader; everything smaller — including legacy pretty-printed files,
      // which are all under the ceiling or they could never have been written —
      // parses as one document.
      const LARGE_FILE_BYTES = 400 * 1024 * 1024;
      const { size } = fs.statSync(filePath);

      const storedItems =
        size >= LARGE_FILE_BYTES ? this.readLargeStoreFileItems(filePath) : this.parseStoreFile(fs.readFileSync(filePath, 'utf-8'), filePath).items;

      for (const item of storedItems) {
        items.set(this.buildStorageKey(item, storeConfig), item);
      }
    }

    const state: KvsStoreState = {
      keyValueStoreName,
      scope,
      items,
      dirty: false,
      flushTimer: null,
      flushPromise: null,
      flushAgain: false,
    };
    this.stores.set(stateKey, state);
    return state;
  }

  private async writeStoreFile(state: KvsStoreState, storeConfig: KeyValueStoreQPQConfigSetting): Promise<void> {
    const filePath = this.getStoreFilePath(state.keyValueStoreName, storeConfig, state.scope);
    const dir = path.dirname(filePath);
    await fs.promises.mkdir(dir, { recursive: true });

    const items = [...state.items.values()].sort((a, b) =>
      compareKvsItemKeys(getKvsItemPk(a, storeConfig), getKvsItemSk(a, storeConfig), getKvsItemPk(b, storeConfig), getKvsItemSk(b, storeConfig)),
    );

    // Streamed, item-by-item serialization of the same `{ "items": [...] }` document.
    //
    // One JSON.stringify over the whole store dies with `RangeError: Invalid string length`
    // the moment a store's serialized form crosses V8's max string (~512MB) — which real
    // stores reach (a bulk event-doc copy fans out through the snapshot projector into
    // hundreds of multi-MB snapshot rows). Serializing per item keeps every stringify
    // bounded by one row, so the FILE size has no ceiling. One row per line (compact)
    // stays greppable and halves the old pretty-printed footprint, which also keeps the
    // read path (one readFileSync string) well clear of the same limit.
    const tmpPath = `${filePath}.tmp`;
    const stream = fs.createWriteStream(tmpPath);

    // write() with a callback resolves once the chunk is flushed, so awaiting it is the
    // backpressure handling. Rows are batched into ~4MB chunks so a million-row store
    // doesn't pay a promise round-trip per row.
    const writeChunk = (chunk: string): Promise<void> =>
      new Promise<void>((resolve, reject) => {
        stream.write(chunk, (error) => (error ? reject(error) : resolve()));
      });

    const CHUNK_TARGET_BYTES = 4 * 1024 * 1024;

    try {
      let buffer = '{\n  "items": [';

      for (let index = 0; index < items.length; index++) {
        buffer += `${index === 0 ? '' : ','}\n    ${JSON.stringify(items[index])}`;

        if (buffer.length >= CHUNK_TARGET_BYTES) {
          await writeChunk(buffer);
          buffer = '';
        }
      }

      buffer += `${items.length === 0 ? '' : '\n  '}]\n}\n`;
      await writeChunk(buffer);

      await new Promise<void>((resolve, reject) => {
        stream.on('error', reject);
        stream.end(() => resolve());
      });
    } catch (error) {
      stream.destroy();
      throw error;
    }

    await fs.promises.rename(tmpPath, filePath);
  }

  // Debounced, coalesced, strictly-serial-per-store flush: a burst of mutations
  // within FLUSH_DEBOUNCE_MS collapses into one write; a mutation that lands
  // while a write is already in flight is folded into the next write instead
  // of starting a second concurrent one.
  private runFlush(state: KvsStoreState, storeConfig: KeyValueStoreQPQConfigSetting): Promise<void> {
    if (state.flushPromise) {
      state.flushAgain = true;
      return state.flushPromise;
    }

    if (!state.dirty) {
      return Promise.resolve();
    }

    state.dirty = false;
    state.flushPromise = this.writeStoreFile(state, storeConfig).then(async () => {
      state.flushPromise = null;
      if (state.flushAgain) {
        state.flushAgain = false;
        await this.runFlush(state, storeConfig);
      }
    });

    return state.flushPromise;
  }

  // Force every dirty store to disk now, bypassing the debounce, and wait for all of it.
  // See KvsRepository.flushAll for why a short-lived process needs this.
  async flushAll(): Promise<void> {
    const pending = [...this.stores.values()].map((state) => {
      if (state.flushTimer) {
        clearTimeout(state.flushTimer);
        state.flushTimer = null;
      }

      return this.runFlush(state, this.getStoreConfig(state.keyValueStoreName));
    });

    await Promise.all(pending);
  }

  private scheduleFlush(state: KvsStoreState, storeConfig: KeyValueStoreQPQConfigSetting): void {
    state.dirty = true;

    if (state.flushTimer) {
      return;
    }

    state.flushTimer = setTimeout(() => {
      state.flushTimer = null;
      void this.runFlush(state, storeConfig);
    }, FLUSH_DEBOUNCE_MS);
    state.flushTimer.unref();
  }

  async get(keyValueStoreName: string, key: string, scope?: string): Promise<any | null> {
    const storeConfig = this.getStoreConfig(keyValueStoreName);
    const state = this.getStore(keyValueStoreName, storeConfig, scope);
    return state.items.get(key) ?? null;
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
    const storeConfig = this.getStoreConfig(keyValueStoreName);
    const state = this.getStore(keyValueStoreName, storeConfig, scope);

    validateKvsQueryOperation(keyCondition);
    if (filter) {
      validateKvsQueryOperation(filter);
    }

    const matched = [...state.items.values()].filter(
      (item) => evaluateKvsQueryOperation(item, keyCondition, storeConfig) && (!filter || evaluateKvsQueryOperation(item, filter, storeConfig)),
    );

    return paginateKvsItems(matched, storeConfig, sortAscending, nextPageKey, limit);
  }

  async scan(
    keyValueStoreName: string,
    filter?: KvsQueryOperation,
    nextPageKey?: string,
    limit?: number,
    scope?: string,
  ): Promise<QpqPagedData<any>> {
    const storeConfig = this.getStoreConfig(keyValueStoreName);
    const state = this.getStore(keyValueStoreName, storeConfig, scope);

    if (filter) {
      validateKvsQueryOperation(filter);
    }

    const matched = filter
      ? [...state.items.values()].filter((item) => evaluateKvsQueryOperation(item, filter, storeConfig))
      : [...state.items.values()];

    return paginateKvsItems(matched, storeConfig, true, nextPageKey, limit);
  }

  async getAll(keyValueStoreName: string, scope?: string): Promise<any[]> {
    const storeConfig = this.getStoreConfig(keyValueStoreName);
    const state = this.getStore(keyValueStoreName, storeConfig, scope);

    return [...state.items.values()];
  }

  async upsert(keyValueStoreName: string, item: any, options?: { ifNotExists?: boolean }, scope?: string): Promise<any> {
    const storeConfig = this.getStoreConfig(keyValueStoreName);
    const state = this.getStore(keyValueStoreName, storeConfig, scope);
    const storageKey = this.buildStorageKey(item, storeConfig);

    if (options?.ifNotExists && state.items.has(storageKey)) {
      const conflictError = new Error(`KVS item already exists in '${keyValueStoreName}'`);
      conflictError.name = 'ConditionalCheckFailedException';
      throw conflictError;
    }

    state.items.set(storageKey, item);
    this.scheduleFlush(state, storeConfig);

    return item;
  }

  async upsertMany(keyValueStoreName: string, items: any[], scope?: string): Promise<KvsUpsertManyResult[]> {
    const storeConfig = this.getStoreConfig(keyValueStoreName);
    const state = this.getStore(keyValueStoreName, storeConfig, scope);

    const results = items.map((item) => {
      const storageKey = this.buildStorageKey(item, storeConfig);
      const oldItem = state.items.get(storageKey) ?? null;
      state.items.set(storageKey, item);
      return { item, oldItem };
    });

    this.scheduleFlush(state, storeConfig);

    return results;
  }

  async update(keyValueStoreName: string, key: string, sortKey: string | undefined, updates: KvsUpdate, scope?: string): Promise<any> {
    const storeConfig = this.getStoreConfig(keyValueStoreName);
    const state = this.getStore(keyValueStoreName, storeConfig, scope);
    const hasSortKey = storeConfig.sortKeys.length > 0;

    const storageKey = hasSortKey && sortKey !== undefined ? `${key}#${sortKey}` : key;
    const existingItem = state.items.get(storageKey);

    // If item doesn't exist, create a base item with just the keys (like DynamoDB UpdateItem)
    const currentItem = existingItem ?? {
      [storeConfig.partitionKey.key]: key,
      ...(hasSortKey && sortKey !== undefined ? { [storeConfig.sortKeys[0].key]: sortKey } : {}),
    };

    const updatedItem = applyUpdateToItem(currentItem, updates);

    state.items.set(storageKey, updatedItem);
    this.scheduleFlush(state, storeConfig);

    return updatedItem;
  }

  async delete(keyValueStoreName: string, key: string, scope?: string): Promise<boolean> {
    const storeConfig = this.getStoreConfig(keyValueStoreName);
    const state = this.getStore(keyValueStoreName, storeConfig, scope);

    if (!state.items.has(key)) {
      return false;
    }

    state.items.delete(key);
    this.scheduleFlush(state, storeConfig);

    return true;
  }

  // Forces every store with a pending or in-flight write to flush immediately.
  async flush(): Promise<void> {
    await Promise.all(
      [...this.stores.values()].map((state) => {
        if (state.flushTimer) {
          clearTimeout(state.flushTimer);
          state.flushTimer = null;
        }
        const storeConfig = this.getStoreConfig(state.keyValueStoreName);
        return this.runFlush(state, storeConfig);
      }),
    );
  }

  async close(): Promise<void> {
    await this.flush();
  }
}
