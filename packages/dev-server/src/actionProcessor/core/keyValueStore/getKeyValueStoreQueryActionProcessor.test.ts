import {
  askKeyValueStoreQueryBase,
  buildTestQpqConfig,
  createActionProcessor,
  defineKeyValueStore,
  ErrorTypeEnum,
  isErroredActionResult,
  KeyValueStoreActionType,
  kvsKey,
  KvsQueryOperationType,
  KvsStoreNotFoundError,
  noopDynamicModuleLoader,
  ProcessorFor,
  resolveActionResult,
  resolveActionResultError,
} from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { invokeProcessor } from '../../../testing/testProcessorRuntime';
import { getKeyValueStoreQueryActionProcessor } from './getKeyValueStoreQueryActionProcessor';

const { repo } = vi.hoisted(() => ({
  repo: { get: vi.fn(), delete: vi.fn(), query: vi.fn(), scan: vi.fn(), update: vi.fn(), upsert: vi.fn() },
}));

vi.mock('../../../logic/keyValueStore/getKvsRepository', () => ({
  getKvsRepository: vi.fn(() => repo),
}));

const devServerConfig = { runtimePath: '/tmp/runtime' } as any;

// A real KvsQueryOperation: the processor walks the condition tree (scope
// gate validation), so a stand-in string would throw before reaching the repo.
const keyCondition = { key: 'id', operation: KvsQueryOperationType.Equal, valueA: 'a' };

// The processors resolve the store's config up front (scope gate), so the
// store under test must be declared.
const testQpqConfig = buildTestQpqConfig([defineKeyValueStore('store', kvsKey('id', 'string'))]);

const getProcessor = async () => {
  const processors = await getKeyValueStoreQueryActionProcessor(devServerConfig)(testQpqConfig, noopDynamicModuleLoader);
  return processors[KeyValueStoreActionType.Query];
};

describe('getKeyValueStoreQueryActionProcessor', () => {
  beforeEach(() => vi.clearAllMocks());

  it('passes the key condition and options to the repository', async () => {
    repo.query.mockResolvedValue({ items: [] });
    const process = await getProcessor();

    const result = await invokeProcessor(process, {
      keyValueStoreName: 'store',
      keyCondition,
      options: { filter: 'f', nextPageKey: 'np', limit: 10, sortAscending: false },
    });

    expect(repo.query).toHaveBeenCalledWith('store', keyCondition, 'f', 'np', undefined, 10, false, undefined);
    expect(resolveActionResult(result)).toEqual({ items: [] });
  });

  it('defaults sortAscending to true when omitted', async () => {
    repo.query.mockResolvedValue({ items: [] });
    const process = await getProcessor();

    await invokeProcessor(process, { keyValueStoreName: 'store', keyCondition });

    expect(repo.query).toHaveBeenCalledWith('store', keyCondition, undefined, undefined, undefined, undefined, true, undefined);
  });

  it('maps a missing store to the typed StoreNotFound', async () => {
    repo.query.mockRejectedValue(new KvsStoreNotFoundError('store'));
    const process = await getProcessor();

    const result = await invokeProcessor(process, { keyValueStoreName: 'store', keyCondition });

    expect(resolveActionResultError(result).errorType).toBe(askKeyValueStoreQueryBase.errorType.StoreNotFound);
  });

  it('maps a generic error to a caught error', async () => {
    repo.query.mockRejectedValue(new Error('boom'));
    const process = await getProcessor();

    const result = await invokeProcessor(process, { keyValueStoreName: 'store', keyCondition });

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.GenericError);
  });
});
