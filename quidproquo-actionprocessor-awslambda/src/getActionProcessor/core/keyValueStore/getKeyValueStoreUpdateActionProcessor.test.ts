import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { buildTestQpqConfig, defineKeyValueStore, KeyValueStoreActionType, KvsUpdateActionType } from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { updateItem } from '../../../logic/dynamo';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getKeyValueStoreUpdateActionProcessor } from './getKeyValueStoreUpdateActionProcessor';

vi.mock('../../../logic/dynamo', () => ({
  updateItem: vi.fn(),
}));

const resolveProcessor = async () => {
  const config = buildTestQpqConfig([
    defineAwsServiceAccountInfo('111', 'eu-west-1'),
    defineKeyValueStore('users', 'pk', ['sk']),
    defineKeyValueStore('orders', 'id', [], { scoped: true, indexes: ['customerId'] }),
  ]);
  const processors = await getKeyValueStoreUpdateActionProcessor(config, {} as any);
  return processors[KeyValueStoreActionType.Update];
};

describe('getKeyValueStoreUpdateActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(updateItem).mockReset();
  });

  it('updates the item using the store partition and sort keys and returns it', async () => {
    vi.mocked(updateItem).mockResolvedValue({ id: 'k1', updated: true } as any);
    const processor = await resolveProcessor();

    const updates = [{ logicalOperation: 'Set' }];
    const result = await invokeProcessor(processor, { keyValueStoreName: 'users', key: 'k1', sortKey: 's1', updates });

    expect(result).toEqual([{ id: 'k1', updated: true }]);
    expect(updateItem).toHaveBeenCalledWith('users-test-app-test-module-development-qpqkvs', 'eu-west-1', updates, 'pk', 'k1', 'sk', 's1');
  });

  it('mirrors a scoped GSI partition key update onto its hidden copy and strips the result', async () => {
    vi.mocked(updateItem).mockResolvedValue({ id: 'acme@@QPQSCOPE@@o-1', customerId: 'c-2', '@@QPQGSI_customerId@@': 'acme@@QPQSCOPE@@c-2' } as any);
    const processor = await resolveProcessor();

    const updates = [{ attributePath: 'customerId', action: KvsUpdateActionType.Set, value: 'c-2' }];
    const result = await invokeProcessor(processor, { keyValueStoreName: 'orders', key: 'o-1', updates, options: { scope: 'acme' } });

    expect(result).toEqual([{ id: 'o-1', customerId: 'c-2' }]);
    expect(vi.mocked(updateItem).mock.calls[0][2]).toEqual([
      ...updates,
      { attributePath: '@@QPQGSI_customerId@@', action: KvsUpdateActionType.Set, value: 'acme@@QPQSCOPE@@c-2' },
    ]);
    expect(vi.mocked(updateItem).mock.calls[0][4]).toBe('acme@@QPQSCOPE@@o-1');
  });
});
