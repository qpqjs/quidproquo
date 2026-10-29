import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { askKeyValueStoreGetBase, defineKeyValueStore, KeyValueStoreActionType } from '@qpqjs/core';
import { buildTestQpqConfig } from '@qpqjs/testing';

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

  // Security regression: the scope gate runs before Dynamo is asked: a scoped store refuses a call without a scope,
  // an unscoped store refuses one with a scope, and a scoped read composes the scope into the key it fetches.
  it('refuses a scoped store without a scope and an unscoped store with one, before touching Dynamo', async () => {
    const config = buildTestQpqConfig([
      defineAwsServiceAccountInfo('111', 'eu-west-1'),
      defineKeyValueStore('users', 'pk', ['sk']),
      defineKeyValueStore('tenants', 'pk', ['sk'], { scoped: true }),
    ]);
    const processor = (await getKeyValueStoreGetActionProcessor(config, {} as any))[KeyValueStoreActionType.Get];

    const [, scopedWithout] = await invokeProcessor(processor, { keyValueStoreName: 'tenants', key: '1' });
    const [, unscopedWith] = await invokeProcessor(processor, { keyValueStoreName: 'users', key: '1', options: { scope: 'tenant-a' } });

    expect(scopedWithout?.errorType).toBe(askKeyValueStoreGetBase.errorType.InvalidScope);
    expect(unscopedWith?.errorType).toBe(askKeyValueStoreGetBase.errorType.InvalidScope);
    expect(getItem).not.toHaveBeenCalled();
  });

  it('composes the scope into the key it fetches', async () => {
    vi.mocked(getItem).mockResolvedValue(undefined as any);
    const config = buildTestQpqConfig([
      defineAwsServiceAccountInfo('111', 'eu-west-1'),
      defineKeyValueStore('tenants', 'pk', ['sk'], { scoped: true }),
    ]);
    const processor = (await getKeyValueStoreGetActionProcessor(config, {} as any))[KeyValueStoreActionType.Get];

    await invokeProcessor(processor, { keyValueStoreName: 'tenants', key: '1', options: { scope: 'tenant-a' } });

    expect(vi.mocked(getItem).mock.calls[0][3]).toBe('tenant-a@@QPQSCOPE@@1');
  });
});
