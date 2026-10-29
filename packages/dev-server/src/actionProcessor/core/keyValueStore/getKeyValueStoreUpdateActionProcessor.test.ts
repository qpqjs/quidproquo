import {
  askKeyValueStoreUpdateBase,
  defineKeyValueStore,
  ErrorTypeEnum,
  isErroredActionResult,
  KeyValueStoreActionType,
  kvsKey,
  kvsLessThan,
  kvsNotExists,
  kvsOr,
  KvsStoreNotFoundError,
  resolveActionResult,
  resolveActionResultError,
} from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor, noopDynamicModuleLoader } from '@qpqjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getKeyValueStoreUpdateActionProcessor } from './getKeyValueStoreUpdateActionProcessor';

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
  const processors = await getKeyValueStoreUpdateActionProcessor(devServerConfig)(testQpqConfig, noopDynamicModuleLoader);
  return processors[KeyValueStoreActionType.Update];
};

describe('getKeyValueStoreUpdateActionProcessor', () => {
  beforeEach(() => vi.clearAllMocks());

  it('stringifies the key and sortKey and passes the updates', async () => {
    repo.update.mockResolvedValue({ id: 1 });
    const process = await getProcessor();

    const result = await invokeProcessor(process, { keyValueStoreName: 'store', key: 1, sortKey: 2, updates: { name: 'x' } });

    expect(repo.update).toHaveBeenCalledWith('store', '1', '2', { name: 'x' }, undefined, { condition: undefined });
    expect(resolveActionResult(result)).toEqual({ id: 1 });
  });

  it('passes undefined for the sortKey when omitted', async () => {
    repo.update.mockResolvedValue({});
    const process = await getProcessor();

    await invokeProcessor(process, { keyValueStoreName: 'store', key: 1, updates: { name: 'x' } });

    expect(repo.update).toHaveBeenCalledWith('store', '1', undefined, { name: 'x' }, undefined, { condition: undefined });
  });

  it('passes a write condition through to the repository', async () => {
    repo.update.mockResolvedValue({});
    const process = await getProcessor();

    const condition = kvsOr([kvsNotExists('headEventId'), kvsLessThan('headEventId', 7)]);
    await invokeProcessor(process, { keyValueStoreName: 'store', key: 1, updates: { name: 'x' }, options: { condition } });

    expect(repo.update).toHaveBeenCalledWith('store', '1', undefined, { name: 'x' }, undefined, { condition });
  });

  it('maps a failed condition to ConditionFailed', async () => {
    repo.update.mockRejectedValue(Object.assign(new Error('condition failed'), { name: 'ConditionalCheckFailedException' }));
    const process = await getProcessor();

    const result = await invokeProcessor(process, { keyValueStoreName: 'store', key: 1, updates: {} });

    expect(resolveActionResultError(result).errorType).toBe(askKeyValueStoreUpdateBase.errorType.ConditionFailed);
  });

  it('maps a missing store to the typed StoreNotFound', async () => {
    repo.update.mockRejectedValue(new KvsStoreNotFoundError('store'));
    const process = await getProcessor();

    const result = await invokeProcessor(process, { keyValueStoreName: 'store', key: 1, updates: {} });

    expect(resolveActionResultError(result).errorType).toBe(askKeyValueStoreUpdateBase.errorType.StoreNotFound);
  });

  it('maps a generic error to a caught error', async () => {
    repo.update.mockRejectedValue(new Error('boom'));
    const process = await getProcessor();

    const result = await invokeProcessor(process, { keyValueStoreName: 'store', key: 1, updates: {} });

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.GenericError);
  });
});
