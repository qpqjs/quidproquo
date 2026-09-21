import {
  askKeyValueStoreGetAllBase,
  buildTestQpqConfig,
  createActionProcessor,
  defineKeyValueStore,
  KeyValueStoreActionType,
  KvsStoreNotFoundError,
  noopDynamicModuleLoader,
  ProcessorFor,
  resolveActionResult,
  resolveActionResultError,
} from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { invokeProcessor } from '../../../testing/testProcessorRuntime';
import { getKeyValueStoreGetAllActionProcessor } from './getKeyValueStoreGetAllActionProcessor';

const { repo } = vi.hoisted(() => ({
  repo: { get: vi.fn(), getAll: vi.fn(), delete: vi.fn(), query: vi.fn(), scan: vi.fn(), update: vi.fn(), upsert: vi.fn() },
}));

vi.mock('../../../logic/keyValueStore/getKvsRepository', () => ({
  getKvsRepository: vi.fn(() => repo),
}));

const devServerConfig = { runtimePath: '/tmp/runtime' } as any;

const getProcessor = async () => {
  const config = buildTestQpqConfig([
    defineKeyValueStore('store', { key: 'id', type: 'string' }),
    defineKeyValueStore('tenantStore', { key: 'id', type: 'string' }, [], { scoped: true }),
  ]);
  const processors = await getKeyValueStoreGetAllActionProcessor(devServerConfig)(config, noopDynamicModuleLoader);
  return processors[KeyValueStoreActionType.GetAll];
};

describe('getKeyValueStoreGetAllActionProcessor', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns every item from the repository', async () => {
    repo.getAll.mockResolvedValue([{ id: 'a' }, { id: 'b' }]);
    const process = await getProcessor();

    const result = await invokeProcessor(process, { keyValueStoreName: 'store' });

    expect(repo.getAll).toHaveBeenCalledWith('store', undefined);
    expect(resolveActionResult(result)).toEqual([{ id: 'a' }, { id: 'b' }]);
  });

  it('passes the scope through to the repository', async () => {
    repo.getAll.mockResolvedValue([]);
    const process = await getProcessor();

    const result = await invokeProcessor(process, { keyValueStoreName: 'tenantStore', options: { scope: 'tenant-a' } });

    expect(repo.getAll).toHaveBeenCalledWith('tenantStore', 'tenant-a');
    expect(resolveActionResult(result)).toEqual([]);
  });

  it('rejects a malformed scope with InvalidScope', async () => {
    const process = await getProcessor();

    const result = await invokeProcessor(process, { keyValueStoreName: 'tenantStore', options: { scope: 'bad/scope' } });

    expect(resolveActionResultError(result).errorType).toBe(askKeyValueStoreGetAllBase.errorType.InvalidScope);
    expect(repo.getAll).not.toHaveBeenCalled();
  });

  it('maps a missing store to the typed StoreNotFound', async () => {
    repo.getAll.mockRejectedValue(new KvsStoreNotFoundError('store'));
    const process = await getProcessor();

    const result = await invokeProcessor(process, { keyValueStoreName: 'store' });

    expect(resolveActionResultError(result).errorType).toBe(askKeyValueStoreGetAllBase.errorType.StoreNotFound);
  });
});
