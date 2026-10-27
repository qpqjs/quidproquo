import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { buildTestQpqConfig, defineKeyValueStore, KeyValueStoreActionType, KvsQueryOperationType } from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAllItems } from '../../../logic/dynamo';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getKeyValueStoreGetAllActionProcessor } from './getKeyValueStoreGetAllActionProcessor';

vi.mock('../../../logic/dynamo', () => ({
  getAllItems: vi.fn(),
}));

const resolveProcessor = async () => {
  const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1'), defineKeyValueStore('users', 'pk', ['sk'])]);
  const processors = await getKeyValueStoreGetAllActionProcessor(config, {} as any);
  return processors[KeyValueStoreActionType.GetAll];
};

describe('getKeyValueStoreGetAllActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(getAllItems).mockReset();
  });

  it('reads every item from the resolved dynamo table, excluding composed rows', async () => {
    vi.mocked(getAllItems).mockResolvedValue([{ id: '1' }] as any);
    const processor = await resolveProcessor();

    const result = await invokeProcessor(processor, { keyValueStoreName: 'users' });

    expect(result).toEqual([[{ id: '1' }]]);
    expect(getAllItems).toHaveBeenCalledWith('users-test-app-test-module-development-qpqkvs', 'eu-west-1', {
      key: 'pk',
      operation: KvsQueryOperationType.NotContains,
      valueA: '@@QPQSCOPE@@',
    });
  });
});
