import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import {
  askKeyValueStoreScanBase,
  buildTestQpqConfig,
  defineKeyValueStore,
  KeyValueStoreActionType,
  KvsLogicalOperatorType,
  KvsQueryOperationType,
} from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { scan } from '../../../logic/dynamo/scan';
import { lastEvaluatedKeyToString } from '../../../logic/dynamo/utils/lastEvaluatedKeyToString';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getKeyValueStoreScanActionProcessor } from './getKeyValueStoreScanActionProcessor';

vi.mock('../../../logic/dynamo/scan', () => ({
  scan: vi.fn(),
}));

const resolveProcessor = async () => {
  const config = buildTestQpqConfig([
    defineAwsServiceAccountInfo('111', 'eu-west-1'),
    defineKeyValueStore('users', 'pk', ['sk']),
    defineKeyValueStore('orders', 'id', [], { scoped: true }),
  ]);
  const processors = await getKeyValueStoreScanActionProcessor(config, {} as any);
  return processors[KeyValueStoreActionType.Scan];
};

describe('getKeyValueStoreScanActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(scan).mockReset();
  });

  // An unscoped scan over a mixed (scoped + unscoped) table must exclude the
  // scope-composed rows, or every tenant's data leaks with composed pk values.
  const composedRowExclusion = { key: 'pk', operation: KvsQueryOperationType.NotContains, valueA: '@@QPQSCOPE@@' };

  it('scans the resolved dynamo table with the filter and page key, excluding composed rows', async () => {
    vi.mocked(scan).mockResolvedValue({ items: [] } as any);
    const processor = await resolveProcessor();

    const result = await invokeProcessor(processor, { keyValueStoreName: 'users', filterCondition: { f: 1 }, nextPageKey: 'pk1' });

    expect(result).toEqual([{ items: [] }]);
    expect(scan).toHaveBeenCalledWith(
      'users-test-app-test-module-development-qpqkvs',
      'eu-west-1',
      { operation: KvsLogicalOperatorType.And, conditions: [composedRowExclusion, { f: 1 }] },
      'pk1',
    );
  });

  it('excludes composed rows from an unscoped filterless scan', async () => {
    vi.mocked(scan).mockResolvedValue({ items: [] } as any);
    const processor = await resolveProcessor();

    await invokeProcessor(processor, { keyValueStoreName: 'users' });

    expect(scan).toHaveBeenCalledWith('users-test-app-test-module-development-qpqkvs', 'eu-west-1', composedRowExclusion, undefined);
  });

  it('refuses a scoped scan page key issued under another scope before reading', async () => {
    const processor = await resolveProcessor();
    const otherScopeKey = lastEvaluatedKeyToString({ id: { S: 'bobco@@QPQSCOPE@@o-1' } });

    const [, error] = await invokeProcessor(processor, { keyValueStoreName: 'orders', nextPageKey: otherScopeKey, options: { scope: 'acme' } });

    expect(error?.errorType).toBe(askKeyValueStoreScanBase.errorType.InvalidScope);
    expect(scan).not.toHaveBeenCalled();
  });
});
