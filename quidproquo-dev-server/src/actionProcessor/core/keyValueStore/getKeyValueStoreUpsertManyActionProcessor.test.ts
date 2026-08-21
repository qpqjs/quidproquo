import {
  askKeyValueStoreUpsertManyBase,
  buildTestQpqConfig,
  createActionProcessor,
  defineKeyValueStore,
  isErroredActionResult,
  KeyValueStoreActionType,
  kvsKey,
  KvsStoreNotFoundError,
  noopDynamicModuleLoader,
  ProcessorFor,
  resolveActionResultError,
} from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { invokeProcessor } from '../../../testing/testProcessorRuntime';
import { getKeyValueStoreUpsertManyActionProcessor } from './getKeyValueStoreUpsertManyActionProcessor';

const { repo, emitKvsStreamEvent } = vi.hoisted(() => ({
  repo: { get: vi.fn(), delete: vi.fn(), query: vi.fn(), scan: vi.fn(), update: vi.fn(), upsert: vi.fn(), upsertMany: vi.fn() },
  emitKvsStreamEvent: vi.fn(),
}));

vi.mock('../../../logic/keyValueStore/getKvsRepository', () => ({
  getKvsRepository: vi.fn(() => repo),
}));

vi.mock('../../../logic/kvsStream', () => ({
  emitKvsStreamEvent,
}));

const devServerConfig = { runtimePath: '/tmp/runtime' } as any;

const testQpqConfig = buildTestQpqConfig([defineKeyValueStore('store', kvsKey('id', 'string'))]);

const getProcessor = async () => {
  const processors = await getKeyValueStoreUpsertManyActionProcessor(devServerConfig)(testQpqConfig, noopDynamicModuleLoader);
  return processors[KeyValueStoreActionType.UpsertMany];
};

describe('getKeyValueStoreUpsertManyActionProcessor', () => {
  beforeEach(() => vi.clearAllMocks());

  it('writes the whole batch through ONE upsertMany call and emits one stream event per item, in order', async () => {
    repo.upsertMany.mockImplementation(async (_name: string, items: any[]) => items.map((item) => ({ item, oldItem: null })));
    const process = await getProcessor();

    const result = await invokeProcessor(process, { keyValueStoreName: 'store', items: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] });

    expect(isErroredActionResult(result)).toBe(false);
    // One repository call is what makes the batch a single transaction on the
    // sqlite engine rather than one commit per item.
    expect(repo.upsertMany).toHaveBeenCalledTimes(1);
    expect(repo.upsertMany).toHaveBeenCalledWith('store', [{ id: 'a' }, { id: 'b' }, { id: 'c' }], undefined);
    expect(emitKvsStreamEvent).toHaveBeenCalledTimes(3);
    expect(emitKvsStreamEvent.mock.calls.map(([, , event]) => event.newImage)).toEqual([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
  });

  it('emits Modify for an existing key and Insert for a fresh one, with the replaced row as oldImage', async () => {
    repo.upsertMany.mockResolvedValue([
      { item: { id: 'a' }, oldItem: { id: 'a', old: true } },
      { item: { id: 'b' }, oldItem: null },
    ]);
    const process = await getProcessor();

    await invokeProcessor(process, { keyValueStoreName: 'store', items: [{ id: 'a' }, { id: 'b' }] });

    expect(emitKvsStreamEvent.mock.calls.map(([, , event]) => event.eventType)).toEqual(['Modify', 'Insert']);
    expect(emitKvsStreamEvent.mock.calls.map(([, , event]) => event.oldImage)).toEqual([{ id: 'a', old: true }, undefined]);
  });

  it('maps a missing store to the typed StoreNotFound', async () => {
    repo.upsertMany.mockRejectedValue(new KvsStoreNotFoundError('store'));
    const process = await getProcessor();

    const result = await invokeProcessor(process, { keyValueStoreName: 'store', items: [{ id: 'a' }] });

    expect(resolveActionResultError(result).errorType).toBe(askKeyValueStoreUpsertManyBase.errorType.StoreNotFound);
  });
});
