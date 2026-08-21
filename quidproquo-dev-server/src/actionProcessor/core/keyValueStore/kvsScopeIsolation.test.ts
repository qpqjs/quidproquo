import {
  buildTestQpqConfig,
  defineKeyValueStore,
  isErroredActionResult,
  KeyValueStoreActionType,
  KvsQueryOperationType,
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
import { getKeyValueStoreUpsertActionProcessor } from './getKeyValueStoreUpsertActionProcessor';

// End-to-end scope isolation through the real sqlite repository: an item
// written under one scope must be invisible to other scopes and to unscoped
// access, and callers must never see the composed pk form.
describe('KVS scope isolation', () => {
  // getKvsRepository caches one repository per service name for the process
  // lifetime, so each test gets its own module name to isolate its store data.
  let testIndex = 0;
  let moduleName: string;
  let runtimePath: string;

  const devServerConfig = () => ({ runtimePath }) as any;
  const qpqConfig = () =>
    buildTestQpqConfig(
      [defineKeyValueStore('widgets', { key: 'id', type: 'string' }), defineKeyValueStore('counters', { key: 'seq', type: 'number' })],
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

  it('round-trips a scoped item, invisible to other scopes and unscoped reads', async () => {
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
    expect(resolveActionResult(unscoped)).toBeNull();
  });

  it('partitions scoped and unscoped rows by the scope column in one table', async () => {
    const { upsert } = await getProcessors();

    await invokeProcessor(upsert, { keyValueStoreName: 'widgets', item: { id: 'w1', name: 'A' }, options: { scope: 'tenant-a' } });
    await invokeProcessor(upsert, { keyValueStoreName: 'widgets', item: { id: 'w2', name: 'B' } });

    const db = new DatabaseSync(path.join(runtimePath, 'kvs', 'kvs.db'));
    try {
      const rows = db.prepare(`SELECT scope, data FROM "qpq_kvs_${moduleName}_widgets" ORDER BY scope`).all() as any[];

      // Items are stored RAW - the scope column is the partition, so the data
      // json carries no composed key values ('' means unscoped).
      expect(rows).toEqual([
        { scope: '', data: JSON.stringify({ id: 'w2', name: 'B' }) },
        { scope: 'tenant-a', data: JSON.stringify({ id: 'w1', name: 'A' }) },
      ]);
    } finally {
      db.close();
    }
  });

  it('keeps unscoped items invisible to scoped reads', async () => {
    const { upsert, get } = await getProcessors();

    await invokeProcessor(upsert, { keyValueStoreName: 'widgets', item: { id: 'w1', name: 'Global' } });

    const scoped = await invokeProcessor(get, { keyValueStoreName: 'widgets', key: 'w1', options: { scope: 'tenant-a' } });
    expect(resolveActionResult(scoped)).toBeNull();
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

  it('restricts scans to the scope and strips returned items', async () => {
    const { upsert, scan } = await getProcessors();

    await invokeProcessor(upsert, { keyValueStoreName: 'widgets', item: { id: 'w1', name: 'A' }, options: { scope: 'tenant-a' } });
    await invokeProcessor(upsert, { keyValueStoreName: 'widgets', item: { id: 'w2', name: 'B' }, options: { scope: 'tenant-b' } });
    await invokeProcessor(upsert, { keyValueStoreName: 'widgets', item: { id: 'w3', name: 'C' } });

    const result = await invokeProcessor(scan, { keyValueStoreName: 'widgets', options: { scope: 'tenant-a' } });

    expect(resolveActionResult(result).items).toEqual([{ id: 'w1', name: 'A' }]);
  });

  it('restricts get-all to the scope', async () => {
    const { upsert, getAll } = await getProcessors();

    await invokeProcessor(upsert, { keyValueStoreName: 'widgets', item: { id: 'w1', name: 'A' }, options: { scope: 'tenant-a' } });
    await invokeProcessor(upsert, { keyValueStoreName: 'widgets', item: { id: 'w2', name: 'B' }, options: { scope: 'tenant-b' } });
    await invokeProcessor(upsert, { keyValueStoreName: 'widgets', item: { id: 'w3', name: 'C' } });

    const scoped = await invokeProcessor(getAll, { keyValueStoreName: 'widgets', options: { scope: 'tenant-a' } });
    expect(resolveActionResult(scoped)).toEqual([{ id: 'w1', name: 'A' }]);

    const unscoped = await invokeProcessor(getAll, { keyValueStoreName: 'widgets' });
    expect(resolveActionResult(unscoped)).toEqual([{ id: 'w3', name: 'C' }]);
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
