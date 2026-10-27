import {
  askKeyValueStoreUpsertBase,
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
import { getKeyValueStoreUpsertActionProcessor } from './getKeyValueStoreUpsertActionProcessor';

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
  const processors = await getKeyValueStoreUpsertActionProcessor(devServerConfig)(testQpqConfig, noopDynamicModuleLoader);
  return processors[KeyValueStoreActionType.Upsert];
};

describe('getKeyValueStoreUpsertActionProcessor', () => {
  beforeEach(() => vi.clearAllMocks());

  it('passes the item to the repository', async () => {
    repo.upsert.mockResolvedValue({ id: 'a' });
    const process = await getProcessor();

    const result = await invokeProcessor(process, { keyValueStoreName: 'store', item: { id: 'a' } });

    expect(repo.upsert).toHaveBeenCalledWith('store', { id: 'a' }, { ifNotExists: undefined }, undefined);
    expect(resolveActionResult(result)).toEqual({ id: 'a' });
  });

  it('maps a missing store to the typed StoreNotFound', async () => {
    repo.upsert.mockRejectedValue(new KvsStoreNotFoundError('store'));
    const process = await getProcessor();

    const result = await invokeProcessor(process, { keyValueStoreName: 'store', item: {} });

    expect(resolveActionResultError(result).errorType).toBe(askKeyValueStoreUpsertBase.errorType.StoreNotFound);
  });

  it('maps a ConditionalCheckFailedException from the repository to Conflict', async () => {
    const conflictError = new Error('KVS item already exists');
    conflictError.name = 'ConditionalCheckFailedException';
    repo.upsert.mockRejectedValue(conflictError);
    const process = await getProcessor();

    const result = await invokeProcessor(process, { keyValueStoreName: 'store', item: { id: 'a' }, options: { ifNotExists: true } });

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorType).toBe(askKeyValueStoreUpsertBase.errorType.Conflict);
  });

  it('maps a generic error to a caught error', async () => {
    repo.upsert.mockRejectedValue(new Error('boom'));
    const process = await getProcessor();

    const result = await invokeProcessor(process, { keyValueStoreName: 'store', item: {} });

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.GenericError);
  });
});
