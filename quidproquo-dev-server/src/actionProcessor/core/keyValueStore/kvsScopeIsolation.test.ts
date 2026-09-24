import {
  buildTestQpqConfig,
  defineKeyValueStore,
  isErroredActionResult,
  KeyValueStoreActionType,
  KvsQueryOperationType,
  KvsUpdateActionType,
  noopDynamicModuleLoader,
  resolveActionResult,
  resolveActionResultError,
} from 'quidproquo-core';

import * as fs from 'fs';
import { DatabaseSync } from 'node:sqlite';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { getKvsRepository } from '../../../logic/keyValueStore/getKvsRepository';
import { invokeProcessor } from '../../../testing/testProcessorRuntime';
import { getKeyValueStoreDeleteActionProcessor } from './getKeyValueStoreDeleteActionProcessor';
import { getKeyValueStoreGetActionProcessor } from './getKeyValueStoreGetActionProcessor';
import { getKeyValueStoreGetAllActionProcessor } from './getKeyValueStoreGetAllActionProcessor';
import { getKeyValueStoreQueryActionProcessor } from './getKeyValueStoreQueryActionProcessor';
import { getKeyValueStoreScanActionProcessor } from './getKeyValueStoreScanActionProcessor';
import { getKeyValueStoreUpdateActionProcessor } from './getKeyValueStoreUpdateActionProcessor';
import { getKeyValueStoreUpsertActionProcessor } from './getKeyValueStoreUpsertActionProcessor';

// End-to-end scope isolation through the real sqlite repository: an item
// written under one scope must be invisible to other scopes, an unscoped call
// on a scoped store is refused outright, and callers must never see the
// composed pk form.
describe('KVS scope isolation', () => {
  // getKvsRepository caches one repository per service name for the process
  // lifetime, so each test gets its own module name to isolate its store data.
  let testIndex = 0;
  let moduleName: string;
  let runtimePath: string;

  const devServerConfig = () => ({ runtimePath }) as any;
  const qpqConfig = () =>
    buildTestQpqConfig(
      [
        defineKeyValueStore('widgets', { key: 'id', type: 'string' }, [], { scoped: true }),
        defineKeyValueStore('gadgets', { key: 'id', type: 'string' }, [], { scoped: true, indexes: ['category'] }),
        defineKeyValueStore('summaries', { key: 'type', type: 'string' }, [{ key: 'id', type: 'string' }], {
          scoped: true,
          indexes: [{ partitionKey: { key: 'type', type: 'string' }, sortKey: { key: 'updatedAt', type: 'string' } }],
        }),
        defineKeyValueStore('counters', { key: 'seq', type: 'number' }, [], { scoped: true }),
        defineKeyValueStore('globals', { key: 'id', type: 'string' }),
      ],
      { moduleName },
    );

  const getProcessors = async () => {
    const config = qpqConfig();
    const devConfig = devServerConfig();
    return {
      upsert: (await getKeyValueStoreUpsertActionProcessor(devConfig)(config, noopDynamicModuleLoader))[KeyValueStoreActionType.Upsert],
      get: (await getKeyValueStoreGetActionProcessor(devConfig)(config, noopDynamicModuleLoader))[KeyValueStoreActionType.Get],
      getAll: (await getKeyValueStoreGetAllActionProcessor(devConfig)(config, noopDynamicModuleLoader))[KeyValueStoreActionType.GetAll],
      query: (await getKeyValueStoreQueryActionProcessor(devConfig)(config, noopDynamicModuleLoader))[KeyValueStoreActionType.Query],
      scan: (await getKeyValueStoreScanActionProcessor(devConfig)(config, noopDynamicModuleLoader))[KeyValueStoreActionType.Scan],
      remove: (await getKeyValueStoreDeleteActionProcessor(devConfig)(config, noopDynamicModuleLoader))[KeyValueStoreActionType.Delete],
      update: (await getKeyValueStoreUpdateActionProcessor(devConfig)(config, noopDynamicModuleLoader))[KeyValueStoreActionType.Update],
    };
  };

  beforeEach(() => {
    moduleName = `kvs-scope-isolation-test-${testIndex++}`;
    runtimePath = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-kvs-scope-'));
  });

  afterEach(async () => {
    await getKvsRepository(qpqConfig(), devServerConfig()).close();
    fs.rmSync(runtimePath, { recursive: true, force: true });
  });

  it('round-trips a scoped item, invisible to other scopes, and refuses an unscoped read', async () => {
    const { upsert, get } = await getProcessors();

    await invokeProcessor(upsert, {
      keyValueStoreName: 'widgets',
      item: { id: 'w1', name: 'Sprocket' },
      options: { scope: 'tenant-a' },
    });

    const sameScope = await invokeProcessor(get, { keyValueStoreName: 'widgets', key: 'w1', options: { scope: 'tenant-a' } });
    expect(resolveActionResult(sameScope)).toEqual({ id: 'w1', name: 'Sprocket' });

    const otherScope = await invokeProcessor(get, { keyValueStoreName: 'widgets', key: 'w1', options: { scope: 'tenant-b' } });
    expect(resolveActionResult(otherScope)).toBeNull();

    const unscoped = await invokeProcessor(get, { keyValueStoreName: 'widgets', key: 'w1' });
    expect(resolveActionResultError(unscoped).errorType).toContain('InvalidScope');
  });

  it('partitions rows by the scope column and stores items raw', async () => {
    const { upsert } = await getProcessors();

    await invokeProcessor(upsert, { keyValueStoreName: 'widgets', item: { id: 'w1', name: 'A' }, options: { scope: 'tenant-a' } });
    await invokeProcessor(upsert, { keyValueStoreName: 'widgets', item: { id: 'w2', name: 'B' }, options: { scope: 'tenant-b' } });

    const db = new DatabaseSync(path.join(runtimePath, 'kvs', 'kvs.db'));
    try {
      const rows = db.prepare(`SELECT scope, data FROM "qpq_kvs_${moduleName}_widgets" ORDER BY scope`).all() as any[];

      // Items are stored RAW - the scope column is the partition, so the data
      // json carries no composed key values.
      expect(rows).toEqual([
        { scope: 'tenant-a', data: JSON.stringify({ id: 'w1', name: 'A' }) },
        { scope: 'tenant-b', data: JSON.stringify({ id: 'w2', name: 'B' }) },
      ]);
    } finally {
      db.close();
    }
  });

  it('refuses a scoped call on an unscoped store', async () => {
    const { upsert, get } = await getProcessors();

    const written = await invokeProcessor(upsert, {
      keyValueStoreName: 'globals',
      item: { id: 'g1', name: 'Global' },
      options: { scope: 'tenant-a' },
    });
    expect(resolveActionResultError(written).errorType).toContain('InvalidScope');

    const read = await invokeProcessor(get, { keyValueStoreName: 'globals', key: 'g1', options: { scope: 'tenant-a' } });
    expect(resolveActionResultError(read).errorType).toContain('InvalidScope');
  });

  it('scopes queries on the partition key and strips returned items', async () => {
    const { upsert, query } = await getProcessors();

    await invokeProcessor(upsert, { keyValueStoreName: 'widgets', item: { id: 'w1', name: 'A' }, options: { scope: 'tenant-a' } });
    await invokeProcessor(upsert, { keyValueStoreName: 'widgets', item: { id: 'w1', name: 'B' }, options: { scope: 'tenant-b' } });

    const result = await invokeProcessor(query, {
      keyValueStoreName: 'widgets',
      keyCondition: { key: 'id', operation: KvsQueryOperationType.Equal, valueA: 'w1' },
      options: { scope: 'tenant-a' },
    });

    expect(resolveActionResult(result).items).toEqual([{ id: 'w1', name: 'A' }]);
  });

  it('rejects a scoped query keyed by the pk alias (aws parity)', async () => {
    const { query } = await getProcessors();

    // The dynamo translator only recognizes the store's real pk attribute, so
    // an alias-keyed scoped query that passed locally would 500 deployed. It
    // must fail locally first.
    const result = await invokeProcessor(query, {
      keyValueStoreName: 'widgets',
      keyCondition: { key: 'pk', operation: KvsQueryOperationType.Equal, valueA: 'w1' },
      options: { scope: 'tenant-a' },
    });

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorType).toContain('InvalidScope');
  });

  it('rejects a scoped query whose key condition does not constrain the partition key', async () => {
    const { query } = await getProcessors();

    const result = await invokeProcessor(query, {
      keyValueStoreName: 'widgets',
      keyCondition: { key: 'name', operation: KvsQueryOperationType.Equal, valueA: 'A' },
      options: { scope: 'tenant-a' },
    });

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorType).toContain('InvalidScope');
  });

  it('serves a scoped query on a GSI partition key from its own scope only, storing rows raw', async () => {
    const { upsert, query } = await getProcessors();

    await invokeProcessor(upsert, { keyValueStoreName: 'gadgets', item: { id: 'g1', category: 'tools' }, options: { scope: 'tenant-a' } });
    await invokeProcessor(upsert, { keyValueStoreName: 'gadgets', item: { id: 'g2', category: 'tools' }, options: { scope: 'tenant-b' } });

    const result = await invokeProcessor(query, {
      keyValueStoreName: 'gadgets',
      keyCondition: { key: 'category', operation: KvsQueryOperationType.Equal, valueA: 'tools' },
      options: { scope: 'tenant-a' },
    });

    expect(resolveActionResult(result).items).toEqual([{ id: 'g1', category: 'tools' }]);
  });

  it("reads a named GSI that shares the pk in the index's order, within the scope (the eventDoc list shape)", async () => {
    const { upsert, query } = await getProcessors();
    const upsertSummary = (id: string, updatedAt: string, scope: string) =>
      invokeProcessor(upsert, { keyValueStoreName: 'summaries', item: { type: 'doc', id, updatedAt }, options: { scope } });

    await upsertSummary('a', '2026-03-01', 'tenant-a');
    await upsertSummary('b', '2026-01-01', 'tenant-a');
    await upsertSummary('c', '2026-02-01', 'tenant-a');
    await upsertSummary('z', '2026-09-01', 'tenant-b');

    const result = await invokeProcessor(query, {
      keyValueStoreName: 'summaries',
      keyCondition: { key: 'type', operation: KvsQueryOperationType.Equal, valueA: 'doc' },
      options: { scope: 'tenant-a', indexName: 'type', sortAscending: false },
    });

    expect(resolveActionResult(result).items.map((item: { id: string }) => item.id)).toEqual(['a', 'c', 'b']);
  });

  it('refuses a query naming an undeclared index', async () => {
    const { query } = await getProcessors();

    const result = await invokeProcessor(query, {
      keyValueStoreName: 'summaries',
      keyCondition: { key: 'type', operation: KvsQueryOperationType.Equal, valueA: 'doc' },
      options: { scope: 'tenant-a', indexName: 'missing' },
    });

    expect(resolveActionResultError(result).errorType).toContain('IndexNotFound');
  });

  it('rejects the scoped GSI operations dynamo cannot serve (aws parity)', async () => {
    const { upsert, query, update } = await getProcessors();

    const rangeOnIndexKey = await invokeProcessor(query, {
      keyValueStoreName: 'gadgets',
      keyCondition: { key: 'category', operation: KvsQueryOperationType.BeginsWith, valueA: 'to' },
      options: { scope: 'tenant-a' },
    });
    expect(resolveActionResultError(rangeOnIndexKey).errorType).toContain('InvalidScope');

    const plantedCopy = await invokeProcessor(upsert, {
      keyValueStoreName: 'gadgets',
      item: { id: 'g1', '@@QPQGSI_category@@': 'tenant-b@@QPQSCOPE@@tools' },
      options: { scope: 'tenant-a' },
    });
    expect(resolveActionResultError(plantedCopy).errorType).toContain('InvalidScope');

    const addToIndexKey = await invokeProcessor(update, {
      keyValueStoreName: 'gadgets',
      key: 'g1',
      updates: [{ attributePath: 'category', action: KvsUpdateActionType.Add, value: 'x' }],
      options: { scope: 'tenant-a' },
    });
    expect(resolveActionResultError(addToIndexKey).errorType).toContain('InvalidScope');
  });

  it('restricts scans to the scope and strips returned items', async () => {
    const { upsert, scan } = await getProcessors();

    await invokeProcessor(upsert, { keyValueStoreName: 'widgets', item: { id: 'w1', name: 'A' }, options: { scope: 'tenant-a' } });
    await invokeProcessor(upsert, { keyValueStoreName: 'widgets', item: { id: 'w2', name: 'B' }, options: { scope: 'tenant-b' } });

    const result = await invokeProcessor(scan, { keyValueStoreName: 'widgets', options: { scope: 'tenant-a' } });

    expect(resolveActionResult(result).items).toEqual([{ id: 'w1', name: 'A' }]);
  });

  it('restricts get-all to the scope', async () => {
    const { upsert, getAll } = await getProcessors();

    await invokeProcessor(upsert, { keyValueStoreName: 'widgets', item: { id: 'w1', name: 'A' }, options: { scope: 'tenant-a' } });
    await invokeProcessor(upsert, { keyValueStoreName: 'widgets', item: { id: 'w2', name: 'B' }, options: { scope: 'tenant-b' } });

    const scoped = await invokeProcessor(getAll, { keyValueStoreName: 'widgets', options: { scope: 'tenant-a' } });
    expect(resolveActionResult(scoped)).toEqual([{ id: 'w1', name: 'A' }]);

    const unscoped = await invokeProcessor(getAll, { keyValueStoreName: 'widgets' });
    expect(resolveActionResultError(unscoped).errorType).toContain('InvalidScope');
  });

  it('deletes only within the scope', async () => {
    const { upsert, get, remove } = await getProcessors();

    await invokeProcessor(upsert, { keyValueStoreName: 'widgets', item: { id: 'w1', name: 'A' }, options: { scope: 'tenant-a' } });
    await invokeProcessor(upsert, { keyValueStoreName: 'widgets', item: { id: 'w1', name: 'B' }, options: { scope: 'tenant-b' } });

    await invokeProcessor(remove, { keyValueStoreName: 'widgets', key: 'w1', options: { scope: 'tenant-a' } });

    const deleted = await invokeProcessor(get, { keyValueStoreName: 'widgets', key: 'w1', options: { scope: 'tenant-a' } });
    expect(resolveActionResult(deleted)).toBeNull();

    const untouched = await invokeProcessor(get, { keyValueStoreName: 'widgets', key: 'w1', options: { scope: 'tenant-b' } });
    expect(resolveActionResult(untouched)).toEqual({ id: 'w1', name: 'B' });
  });

  it('rejects a scoped write whose partition key value contains the scope delimiter', async () => {
    const { upsert } = await getProcessors();

    // AWS composes 'tenant-a@@QPQSCOPE@@acme@@QPQSCOPE@@secret' and throws;
    // the json backend stores raw, so it must throw the same typed error for
    // parity.
    const result = await invokeProcessor(upsert, {
      keyValueStoreName: 'widgets',
      item: { id: 'acme@@QPQSCOPE@@secret', name: 'X' },
      options: { scope: 'tenant-a' },
    });

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorType).toContain('InvalidScope');
  });

  it('rejects a malformed scope with the typed error', async () => {
    const { get } = await getProcessors();

    const result = await invokeProcessor(get, { keyValueStoreName: 'widgets', key: 'w1', options: { scope: '../tenant-b' } });

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorType).toContain('InvalidScope');
  });

  it('rejects scope on a store with a non-string partition key', async () => {
    const { upsert } = await getProcessors();

    const result = await invokeProcessor(upsert, {
      keyValueStoreName: 'counters',
      item: { seq: 1, value: 'x' },
      options: { scope: 'tenant-a' },
    });

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorType).toContain('InvalidScope');
  });
});
