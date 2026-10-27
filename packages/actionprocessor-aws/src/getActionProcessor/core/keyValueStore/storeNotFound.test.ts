import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import {
  askKeyValueStoreDelete,
  askKeyValueStoreGetBase,
  askKeyValueStoreQueryBase,
  buildTestQpqConfig,
  KeyValueStoreActionType,
} from 'quidproquo-core';

import { describe, expect, it, vi } from 'vitest';

import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getKeyValueStoreDeleteActionProcessor } from './getKeyValueStoreDeleteActionProcessor';
import { getKeyValueStoreGetActionProcessor } from './getKeyValueStoreGetActionProcessor';
import { getKeyValueStoreQueryActionProcessor } from './getKeyValueStoreQueryActionProcessor';

vi.mock('../../../logic/dynamo', () => ({
  getItem: vi.fn(),
  deleteItem: vi.fn(),
}));
vi.mock('../../../logic/dynamo/query', () => ({
  query: vi.fn(),
}));

// A store name that is not declared in the qpq config is a MISCONFIGURATION,
// and it must surface the same way from every processor: the action's own
// typed StoreNotFound error - not a bare throw (GenericError), not a generic
// NotFound, and never a `!` crash.
const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1')]);

describe('KVS store-not-found error shape', () => {
  it('returns the typed StoreNotFound error from Get', async () => {
    const processor = (await getKeyValueStoreGetActionProcessor(config, {} as any))[KeyValueStoreActionType.Get];

    const [, error] = await invokeProcessor(processor, { keyValueStoreName: 'missing-store', key: 'k' });

    expect(error?.errorType).toBe(askKeyValueStoreGetBase.errorType.StoreNotFound);
  });

  it('returns the typed StoreNotFound error from Delete', async () => {
    const processor = (await getKeyValueStoreDeleteActionProcessor(config, {} as any))[KeyValueStoreActionType.Delete];

    const [, error] = await invokeProcessor(processor, { keyValueStoreName: 'missing-store', key: 'k' });

    expect(error?.errorType).toBe(askKeyValueStoreDelete.errorType.StoreNotFound);
  });

  it('returns the typed StoreNotFound error from a scoped Query', async () => {
    const processor = (await getKeyValueStoreQueryActionProcessor(config, {} as any))[KeyValueStoreActionType.Query];

    const [, error] = await invokeProcessor(processor, {
      keyValueStoreName: 'missing-store',
      keyCondition: { key: 'id', operation: 'Equal', valueA: 'a' },
      options: { scope: 'tenant-a' },
    });

    expect(error?.errorType).toBe(askKeyValueStoreQueryBase.errorType.StoreNotFound);
  });
});
