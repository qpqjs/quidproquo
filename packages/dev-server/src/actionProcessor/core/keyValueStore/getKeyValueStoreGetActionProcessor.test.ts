import {
  askKeyValueStoreGetBase,
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
import { getKeyValueStoreGetActionProcessor } from './getKeyValueStoreGetActionProcessor';

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
  const processors = await getKeyValueStoreGetActionProcessor(devServerConfig)(testQpqConfig, noopDynamicModuleLoader);
  return processors[KeyValueStoreActionType.Get];
};

describe('getKeyValueStoreGetActionProcessor', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the value from the repository', async () => {
    repo.get.mockResolvedValue({ id: 'a' });
    const process = await getProcessor();

    const result = await invokeProcessor(process, { keyValueStoreName: 'store', key: 'a' });

    expect(repo.get).toHaveBeenCalledWith('store', 'a', undefined);
    expect(resolveActionResult(result)).toEqual({ id: 'a' });
  });

  it('maps a missing store to the typed StoreNotFound', async () => {
    repo.get.mockRejectedValue(new KvsStoreNotFoundError('store'));
    const process = await getProcessor();

    const result = await invokeProcessor(process, { keyValueStoreName: 'store', key: 'a' });

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorType).toBe(askKeyValueStoreGetBase.errorType.StoreNotFound);
  });

  it('maps a generic error to a caught error', async () => {
    repo.get.mockRejectedValue(new Error('boom'));
    const process = await getProcessor();

    const result = await invokeProcessor(process, { keyValueStoreName: 'store', key: 'a' });

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.GenericError);
  });
});
