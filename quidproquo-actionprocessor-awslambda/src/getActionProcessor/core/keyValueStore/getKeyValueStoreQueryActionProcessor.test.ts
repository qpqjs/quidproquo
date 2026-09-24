import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import {
  askKeyValueStoreQueryBase,
  buildTestQpqConfig,
  createActionProcessor,
  defineKeyValueStore,
  KeyValueStoreActionType,
  KvsQueryOperationType,
  ProcessorFor,
} from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { query } from '../../../logic/dynamo';
import { getDynamoTableIndexByConfigAndQuery } from '../../../logic/dynamo/qpqDynamoOrm';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getKeyValueStoreQueryActionProcessor } from './getKeyValueStoreQueryActionProcessor';

vi.mock('../../../logic/dynamo', () => ({
  query: vi.fn(),
}));
vi.mock('../../../logic/dynamo/qpqDynamoOrm', () => ({
  getDynamoTableIndexByConfigAndQuery: vi.fn(),
}));

const scopedOrdersStore = defineKeyValueStore('orders', 'id', [], { scoped: true, indexes: [{ partitionKey: 'customerId', sortKey: 'createdAt' }] });

const resolveProcessor = async (withStore = true) => {
  const settings = [
    defineAwsServiceAccountInfo('111', 'eu-west-1'),
    ...(withStore ? [defineKeyValueStore('users', 'pk', ['sk']), scopedOrdersStore] : []),
  ];
  const processors = await getKeyValueStoreQueryActionProcessor(buildTestQpqConfig(settings), {} as any);
  return processors[KeyValueStoreActionType.Query];
};

describe('getKeyValueStoreQueryActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(query).mockReset();
    vi.mocked(getDynamoTableIndexByConfigAndQuery).mockReset();
  });

  it('queries the resolved table and returns the items', async () => {
    vi.mocked(getDynamoTableIndexByConfigAndQuery).mockReturnValue('gsi-1' as any);
    vi.mocked(query).mockResolvedValue({ items: [{ id: '1' }], nextPageKey: undefined } as any);
    const processor = await resolveProcessor();

    const result = await invokeProcessor(processor, { keyValueStoreName: 'users', keyCondition: { pk: '1' }, options: { limit: 10 } });

    expect(result).toEqual([{ items: [{ id: '1' }], nextPageKey: undefined }]);
    expect(vi.mocked(query).mock.calls[0][0]).toBe('users-test-app-test-module-development-qpqkvs');
  });

  it("routes a scoped GSI query by the caller's condition, onto the index's hidden copy, and strips the results", async () => {
    vi.mocked(getDynamoTableIndexByConfigAndQuery).mockReturnValue('customerId');
    vi.mocked(query).mockResolvedValue({
      items: [{ id: 'acme@@QPQSCOPE@@o-1', customerId: 'c-9', '@@QPQGSI_customerId@@': 'acme@@QPQSCOPE@@c-9' }],
      nextPageKey: undefined,
    } as any);
    const processor = await resolveProcessor();
    const keyCondition = { key: 'customerId', operation: KvsQueryOperationType.Equal, valueA: 'c-9' };

    const [result] = await invokeProcessor(processor, { keyValueStoreName: 'orders', keyCondition, options: { scope: 'acme' } });

    expect(getDynamoTableIndexByConfigAndQuery).toHaveBeenCalledWith(expect.objectContaining({ keyValueStoreName: 'orders' }), keyCondition);
    expect(vi.mocked(query).mock.calls[0][2]).toEqual({
      key: '@@QPQGSI_customerId@@',
      operation: KvsQueryOperationType.Equal,
      valueA: 'acme@@QPQSCOPE@@c-9',
    });
    expect(vi.mocked(query).mock.calls[0][5]).toBe('customerId');
    expect(result).toEqual({ items: [{ id: 'o-1', customerId: 'c-9' }], nextPageKey: undefined });
  });

  it('returns the typed StoreNotFound error when the store is not configured', async () => {
    const processor = await resolveProcessor(false);

    const [, error] = await invokeProcessor(processor, { keyValueStoreName: 'users', keyCondition: {} });

    expect(error?.errorType).toBe(askKeyValueStoreQueryBase.errorType.StoreNotFound);
  });
});
