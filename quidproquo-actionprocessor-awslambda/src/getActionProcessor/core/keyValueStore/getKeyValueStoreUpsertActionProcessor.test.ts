import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import {
  askKeyValueStoreUpsertBase,
  buildTestQpqConfig,
  createActionProcessor,
  defineKeyValueStore,
  KeyValueStoreActionType,
  ProcessorFor,
} from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { putItem } from '../../../logic/dynamo';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getKeyValueStoreUpsertActionProcessor } from './getKeyValueStoreUpsertActionProcessor';

vi.mock('../../../logic/dynamo', () => ({
  putItem: vi.fn(),
}));

const resolveProcessor = async (withStore = true) => {
  const settings = [defineAwsServiceAccountInfo('111', 'eu-west-1'), ...(withStore ? [defineKeyValueStore('users', 'pk', ['sk'])] : [])];
  const processors = await getKeyValueStoreUpsertActionProcessor(buildTestQpqConfig(settings), {} as any);
  return processors[KeyValueStoreActionType.Upsert];
};

const invoke = (processor: any, options?: any) => invokeProcessor(processor, { keyValueStoreName: 'users', item: { pk: '1' }, options });

describe('getKeyValueStoreUpsertActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(putItem).mockReset();
  });

  it('writes the item with the store keys and ttl', async () => {
    const processor = await resolveProcessor();

    const result = await invoke(processor, { ttlInSeconds: 60 });

    expect(result).toEqual([undefined]);
    const [tableName, item, , ttlOptions, region] = vi.mocked(putItem).mock.calls[0];
    expect(tableName).toBe('users-test-app-test-module-development-qpqkvs');
    expect(item).toEqual({ pk: '1' });
    expect(ttlOptions).toEqual({ expires: 60 });
    expect(region).toBe('eu-west-1');
  });

  it('returns the typed StoreNotFound error when the store is not configured', async () => {
    const processor = await resolveProcessor(false);

    const [, error] = await invoke(processor);

    expect(error?.errorType).toBe(askKeyValueStoreUpsertBase.errorType.StoreNotFound);
  });

  it.each([
    ['InternalServerError', askKeyValueStoreUpsertBase.errorType.ServiceUnavailable],
    ['ResourceNotFoundException', askKeyValueStoreUpsertBase.errorType.ResourceNotFound],
    ['ConditionalCheckFailedException', askKeyValueStoreUpsertBase.errorType.Conflict],
    ['TransactionConflictException', askKeyValueStoreUpsertBase.errorType.WriteContention],
  ])('maps %s to the matching error type', async (errorName: string, expectedType: string) => {
    vi.mocked(putItem).mockRejectedValue(Object.assign(new Error('boom'), { name: errorName }));
    const processor = await resolveProcessor();

    const [, error] = await invoke(processor);

    expect(error?.errorType).toBe(expectedType);
  });
});
