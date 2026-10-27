import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { buildTestQpqConfig, defineKeyValueStore, KeyValueStoreActionType } from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getItem } from '../../../logic/dynamo';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getKeyValueStoreGetActionProcessor } from './getKeyValueStoreGetActionProcessor';

vi.mock('../../../logic/dynamo', () => ({
  getItem: vi.fn(),
}));

const resolveProcessor = async () => {
  const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1'), defineKeyValueStore('users', 'pk', ['sk'])]);
  const processors = await getKeyValueStoreGetActionProcessor(config, {} as any);
  return processors[KeyValueStoreActionType.Get];
};

describe('getKeyValueStoreGetActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(getItem).mockReset();
  });

  it('reads the item from the resolved dynamo table', async () => {
    vi.mocked(getItem).mockResolvedValue({ id: '1' } as any);
    const processor = await resolveProcessor();

    const result = await invokeProcessor(processor, { keyValueStoreName: 'users', key: '1' });

    expect(result).toEqual([{ id: '1' }]);
    expect(getItem).toHaveBeenCalledWith('users-test-app-test-module-development-qpqkvs', 'eu-west-1', 'pk', '1');
  });
});
