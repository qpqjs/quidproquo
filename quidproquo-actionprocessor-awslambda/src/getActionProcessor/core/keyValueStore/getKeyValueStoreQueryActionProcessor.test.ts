import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { askKeyValueStoreQueryBase, buildTestQpqConfig, defineKeyValueStore, KeyValueStoreActionType, KvsQueryOperationType } from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { query } from '../../../logic/dynamo';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getKeyValueStoreQueryActionProcessor } from './getKeyValueStoreQueryActionProcessor';

vi.mock('../../../logic/dynamo', () => ({
  query: vi.fn(),
}));

const scopedOrdersStore = defineKeyValueStore('orders', 'id', [], {
  scoped: true,
  indexes: [
    { partitionKey: 'customerId', sortKey: 'createdAt' },
    { name: 'customerByTotal', partitionKey: 'customerId', sortKey: 'total' },
  ],
});

// A GSI sharing the table pk, sorted differently - the eventDoc summary shape.
const summariesStore = defineKeyValueStore('summaries', 'type', ['id'], { scoped: true, indexes: [{ partitionKey: 'type', sortKey: 'updatedAt' }] });

const resolveProcessor = async (withStore = true) => {
  const settings = [
    defineAwsServiceAccountInfo('111', 'eu-west-1'),
    ...(withStore ? [defineKeyValueStore('users', 'pk', ['sk']), scopedOrdersStore, summariesStore] : []),
  ];
  const processors = await getKeyValueStoreQueryActionProcessor(buildTestQpqConfig(settings), {} as any);
  return processors[KeyValueStoreActionType.Query];
};

const equal = (key: string, valueA: string) => ({ key, operation: KvsQueryOperationType.Equal, valueA });

describe('getKeyValueStoreQueryActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(query).mockReset();
    vi.mocked(query).mockResolvedValue({ items: [], nextPageKey: undefined } as any);
  });

  it('queries the resolved table and returns the items', async () => {
    vi.mocked(query).mockResolvedValue({ items: [{ id: '1' }], nextPageKey: undefined } as any);
    const processor = await resolveProcessor();

    const result = await invokeProcessor(processor, { keyValueStoreName: 'users', keyCondition: equal('pk', '1'), options: { limit: 10 } });

    expect(result).toEqual([{ items: [{ id: '1' }], nextPageKey: undefined }]);
    expect(vi.mocked(query).mock.calls[0][0]).toBe('users-test-app-test-module-development-qpqkvs');
    expect(vi.mocked(query).mock.calls[0][5]).toBeUndefined();
  });

  it("routes a scoped GSI query by the caller's condition, onto the index's hidden copy, and strips the results", async () => {
    vi.mocked(query).mockResolvedValue({
      items: [{ id: 'acme@@QPQSCOPE@@o-1', customerId: 'c-9', '@@QPQGSI_customerId@@': 'acme@@QPQSCOPE@@c-9' }],
      nextPageKey: undefined,
    } as any);
    const processor = await resolveProcessor();

    const [result] = await invokeProcessor(processor, {
      keyValueStoreName: 'orders',
      keyCondition: equal('customerId', 'c-9'),
      options: { scope: 'acme' },
    });

    expect(vi.mocked(query).mock.calls[0][2]).toEqual(equal('@@QPQGSI_customerId@@', 'acme@@QPQSCOPE@@c-9'));
    expect(vi.mocked(query).mock.calls[0][5]).toBe('customerId');
    expect(result).toEqual({ items: [{ id: 'o-1', customerId: 'c-9' }], nextPageKey: undefined });
  });

  it('reads a GSI that shares the table pk only when the query names it', async () => {
    const processor = await resolveProcessor();
    const keyCondition = equal('type', 'doc');

    await invokeProcessor(processor, { keyValueStoreName: 'summaries', keyCondition, options: { scope: 'acme' } });
    await invokeProcessor(processor, { keyValueStoreName: 'summaries', keyCondition, options: { scope: 'acme', indexName: 'type' } });

    expect(vi.mocked(query).mock.calls[0][5]).toBeUndefined();
    expect(vi.mocked(query).mock.calls[1][5]).toBe('type');
    expect(vi.mocked(query).mock.calls[1][2]).toEqual(equal('type', 'acme@@QPQSCOPE@@doc'));
  });

  it('queries an explicitly named index by its name, still rewriting its partition key onto the hidden copy', async () => {
    const processor = await resolveProcessor();

    await invokeProcessor(processor, {
      keyValueStoreName: 'orders',
      keyCondition: equal('customerId', 'c-9'),
      options: { scope: 'acme', indexName: 'customerByTotal' },
    });

    expect(vi.mocked(query).mock.calls[0][5]).toBe('customerByTotal');
    expect(vi.mocked(query).mock.calls[0][2]).toEqual(equal('@@QPQGSI_customerId@@', 'acme@@QPQSCOPE@@c-9'));
  });

  it('returns the typed IndexNotFound error for an undeclared index', async () => {
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(processor, {
      keyValueStoreName: 'users',
      keyCondition: equal('pk', '1'),
      options: { indexName: 'missing' },
    });

    expect(error?.errorType).toBe(askKeyValueStoreQueryBase.errorType.IndexNotFound);
    expect(query).not.toHaveBeenCalled();
  });

  it('returns the typed StoreNotFound error when the store is not configured', async () => {
    const processor = await resolveProcessor(false);

    const [, error] = await invokeProcessor(processor, { keyValueStoreName: 'users', keyCondition: {} });

    expect(error?.errorType).toBe(askKeyValueStoreQueryBase.errorType.StoreNotFound);
  });
});
