import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { defineKeyValueStore, KeyValueStoreActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor } from '@qpqjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { scan } from '../../../logic/dynamo';
import { getKeyValueStoreScanAllScopesActionProcessor } from './getKeyValueStoreScanAllScopesActionProcessor';

vi.mock('../../../logic/dynamo', () => ({
  scan: vi.fn(),
}));

const resolveProcessor = async () => {
  const config = buildTestQpqConfig([
    defineAwsServiceAccountInfo('111', 'eu-west-1'),
    defineKeyValueStore('orders', 'id', [], { scoped: true, indexes: ['customerId'] }),
  ]);
  const processors = await getKeyValueStoreScanAllScopesActionProcessor(config, {} as any);
  return processors[KeyValueStoreActionType.ScanAllScopes];
};

describe('getKeyValueStoreScanAllScopesActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(scan).mockReset();
  });

  it("splits each row into its scope and raw item, dropping a scoped row's hidden index copies", async () => {
    vi.mocked(scan).mockResolvedValue({
      items: [
        { id: 'acme@@QPQSCOPE@@o-1', customerId: 'c-9', '@@QPQGSI_customerId@@': 'acme@@QPQSCOPE@@c-9' },
        { id: 'o-2', customerId: 'c-1' },
      ],
      nextPageKey: undefined,
    } as any);
    const processor = await resolveProcessor();

    const [result] = await invokeProcessor(processor, { keyValueStoreName: 'orders' });

    expect(result).toEqual({
      items: [
        { scope: 'acme', item: { id: 'o-1', customerId: 'c-9' } },
        { scope: undefined, item: { id: 'o-2', customerId: 'c-1' } },
      ],
      nextPageKey: undefined,
    });
  });
});
