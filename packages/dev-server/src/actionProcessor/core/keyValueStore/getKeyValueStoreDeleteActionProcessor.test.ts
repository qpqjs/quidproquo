import {
  askKeyValueStoreDelete,
  buildTestQpqConfig,
  createActionProcessor,
  defineKeyValueStore,
  ErrorTypeEnum,
  isErroredActionResult,
  KeyValueStoreActionType,
  kvsKey,
  KvsStoreNotFoundError,
  noopDynamicModuleLoader,
  ProcessorFor,
  resolveActionResult,
  resolveActionResultError,
} from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { invokeProcessor } from '../../../testing/testProcessorRuntime';
import { getKeyValueStoreDeleteActionProcessor } from './getKeyValueStoreDeleteActionProcessor';

const { repo } = vi.hoisted(() => ({
  repo: { get: vi.fn(), delete: vi.fn(), query: vi.fn(), scan: vi.fn(), update: vi.fn(), upsert: vi.fn() },
}));

vi.mock('../../../logic/keyValueStore/getKvsRepository', () => ({
  getKvsRepository: vi.fn(() => repo),
}));

const devServerConfig = { runtimePath: '/tmp/runtime' } as any;

// The processors resolve the store's config up front (scope gate), so the
// store under test must be declared.
const testQpqConfig = buildTestQpqConfig([defineKeyValueStore('store', kvsKey('id', 'string'))]);

const getProcessor = async () => {
  const processors = await getKeyValueStoreDeleteActionProcessor(devServerConfig)(testQpqConfig, noopDynamicModuleLoader);
  return processors[KeyValueStoreActionType.Delete];
};

describe('getKeyValueStoreDeleteActionProcessor', () => {
  beforeEach(() => vi.clearAllMocks());

  it('builds a composite key when a sortKey is given', async () => {
    repo.delete.mockResolvedValue(true);
    const process = await getProcessor();

    await invokeProcessor(process, { keyValueStoreName: 'store', key: 'a', sortKey: 'b' });

    expect(repo.delete).toHaveBeenCalledWith('store', 'a#b', undefined);
  });

  it('uses the key as-is when no sortKey is given', async () => {
    repo.delete.mockResolvedValue(true);
    const process = await getProcessor();

    const result = await invokeProcessor(process, { keyValueStoreName: 'store', key: 'a' });

    expect(repo.delete).toHaveBeenCalledWith('store', 'a', undefined);
    expect(resolveActionResult(result)).toBeUndefined();
  });

  it('returns ResourceNotFound when the repository reports no deletion', async () => {
    repo.delete.mockResolvedValue(false);
    const process = await getProcessor();

    const result = await invokeProcessor(process, { keyValueStoreName: 'store', key: 'a' });

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorType).toBe('ResourceNotFound');
    expect(resolveActionResultError(result).errorText).toBe("Item with key 'a' not found");
  });

  it('maps a missing store to the typed StoreNotFound', async () => {
    repo.delete.mockRejectedValue(new KvsStoreNotFoundError('store'));
    const process = await getProcessor();

    const result = await invokeProcessor(process, { keyValueStoreName: 'store', key: 'a' });

    expect(resolveActionResultError(result).errorType).toBe(askKeyValueStoreDelete.errorType.StoreNotFound);
  });

  it('maps a generic error to a caught error', async () => {
    repo.delete.mockRejectedValue(new Error('boom'));
    const process = await getProcessor();

    const result = await invokeProcessor(process, { keyValueStoreName: 'store', key: 'a' });

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.GenericError);
  });
});
