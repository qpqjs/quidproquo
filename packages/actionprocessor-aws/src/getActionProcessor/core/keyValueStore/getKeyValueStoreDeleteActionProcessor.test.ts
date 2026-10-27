import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { buildTestQpqConfig, defineKeyValueStore, KeyValueStoreActionType } from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { deleteItem } from '../../../logic/dynamo';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getKeyValueStoreDeleteActionProcessor } from './getKeyValueStoreDeleteActionProcessor';

vi.mock('../../../logic/dynamo', () => ({
  deleteItem: vi.fn(),
}));

const resolveProcessor = async () => {
  const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1'), defineKeyValueStore('users', 'pk', ['sk'])]);
  const processors = await getKeyValueStoreDeleteActionProcessor(config, {} as any);
  return processors[KeyValueStoreActionType.Delete];
};

describe('getKeyValueStoreDeleteActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(deleteItem).mockReset();
  });

  it('deletes the item using the store partition and sort keys', async () => {
    const processor = await resolveProcessor();

    const result = await invokeProcessor(processor, { keyValueStoreName: 'users', key: 'k1', sortKey: 's1' });

    expect(result).toEqual([undefined]);
    expect(deleteItem).toHaveBeenCalledWith('users-test-app-test-module-development-qpqkvs', 'eu-west-1', 'k1', 'pk', 's1', 'sk');
  });
});
