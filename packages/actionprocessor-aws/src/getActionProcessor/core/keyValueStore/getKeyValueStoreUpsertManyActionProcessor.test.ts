import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { askKeyValueStoreUpsertManyBase, defineKeyValueStore, KeyValueStoreActionType } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor } from '@qpqjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { batchPutItems, transactPutItems } from '../../../logic/dynamo';
import { getKeyValueStoreUpsertManyActionProcessor } from './getKeyValueStoreUpsertManyActionProcessor';

vi.mock('../../../logic/dynamo', () => ({
  batchPutItems: vi.fn(),
  transactPutItems: vi.fn(),
}));

const resolveProcessor = async (withStore = true) => {
  const settings = [defineAwsServiceAccountInfo('111', 'eu-west-1'), ...(withStore ? [defineKeyValueStore('users', 'pk', ['sk'])] : [])];
  const processors = await getKeyValueStoreUpsertManyActionProcessor(buildTestQpqConfig(settings), {} as any);
  return processors[KeyValueStoreActionType.UpsertMany];
};

const items = [
  { pk: '1', sk: 'a' },
  { pk: '2', sk: 'a' },
];

describe('getKeyValueStoreUpsertManyActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(batchPutItems).mockReset();
    vi.mocked(transactPutItems).mockReset();
  });

  it('batch writes the items unconditionally', async () => {
    const processor = await resolveProcessor();

    const result = await invokeProcessor(processor!, { keyValueStoreName: 'users', items });

    expect(result).toEqual([undefined]);
    expect(batchPutItems).toHaveBeenCalledWith('users-test-app-test-module-development-qpqkvs', items, 'eu-west-1');
    expect(transactPutItems).not.toHaveBeenCalled();
  });

  it('writes conditionally in one transaction when ifNotExists is asked for', async () => {
    const processor = await resolveProcessor();

    await invokeProcessor(processor!, { keyValueStoreName: 'users', items, options: { ifNotExists: true } });

    expect(transactPutItems).toHaveBeenCalledWith('users-test-app-test-module-development-qpqkvs', items, 'pk', 'eu-west-1');
    expect(batchPutItems).not.toHaveBeenCalled();
  });

  // Dynamo only rejects same-key duplicates inside one 25-item chunk; across chunks the later write would win by position.
  it('rejects a batch with two items of the same key before writing anything', async () => {
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(processor!, {
      keyValueStoreName: 'users',
      items: [
        { pk: '1', sk: 'a' },
        { pk: '1', sk: 'a' },
      ],
    });

    expect(error?.errorType).toBe(askKeyValueStoreUpsertManyBase.errorType.DuplicateKey);
    expect(batchPutItems).not.toHaveBeenCalled();
  });

  it('returns the typed StoreNotFound error when the store is not configured', async () => {
    const processor = await resolveProcessor(false);

    const [, error] = await invokeProcessor(processor!, { keyValueStoreName: 'users', items });

    expect(error?.errorType).toBe(askKeyValueStoreUpsertManyBase.errorType.StoreNotFound);
  });

  it.each([
    ['InternalServerError', askKeyValueStoreUpsertManyBase.errorType.Throttled],
    ['ResourceNotFoundException', askKeyValueStoreUpsertManyBase.errorType.ResourceNotFound],
    ['BatchWriteUnprocessedItemsError', askKeyValueStoreUpsertManyBase.errorType.Throttled],
    ['ConditionalCheckFailedException', askKeyValueStoreUpsertManyBase.errorType.Conflict],
    ['TransactionConflictException', askKeyValueStoreUpsertManyBase.errorType.WriteContention],
  ])('maps %s to the matching error type', async (errorName: string, expectedType: string) => {
    vi.mocked(batchPutItems).mockRejectedValue(Object.assign(new Error('boom'), { name: errorName }));
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(processor!, { keyValueStoreName: 'users', items });

    expect(error?.errorType).toBe(expectedType);
  });
});
