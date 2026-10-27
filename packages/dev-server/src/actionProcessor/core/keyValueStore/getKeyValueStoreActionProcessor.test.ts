import { buildTestQpqConfig, KeyValueStoreActionType, noopDynamicModuleLoader } from 'quidproquo-core';

import { describe, expect, it, vi } from 'vitest';

import { getKeyValueStoreActionProcessor } from './getKeyValueStoreActionProcessor';

const { repo } = vi.hoisted(() => ({
  repo: { get: vi.fn(), getAll: vi.fn(), delete: vi.fn(), query: vi.fn(), scan: vi.fn(), update: vi.fn(), upsert: vi.fn() },
}));

vi.mock('../../../logic/keyValueStore/getKvsRepository', () => ({
  getKvsRepository: vi.fn(() => repo),
}));

const devServerConfig = { runtimePath: '/tmp/runtime' } as any;

describe('getKeyValueStoreActionProcessor', () => {
  it('aggregates a processor for every key value store action type', async () => {
    const processors = await getKeyValueStoreActionProcessor(devServerConfig)(buildTestQpqConfig(), noopDynamicModuleLoader);

    expect(Object.keys(processors).sort()).toEqual(
      [
        KeyValueStoreActionType.Get,
        KeyValueStoreActionType.GetAll,
        KeyValueStoreActionType.Delete,
        KeyValueStoreActionType.Query,
        KeyValueStoreActionType.Scan,
        KeyValueStoreActionType.ScanAllScopes,
        KeyValueStoreActionType.Update,
        KeyValueStoreActionType.Upsert,
        KeyValueStoreActionType.UpsertMany,
      ].sort(),
    );
  });
});
