import { AskResponse } from '../../types/StorySession';
import { createActionRequester } from '../../types/utils/createActionRequester';
import { KeyValueStoreActionType } from './KeyValueStoreActionType';
import { KvsItemRecord } from './types';

export type KeyValueStoreUpsertManyOptions = {
  // Conditional batch insert: only write when NO item in the batch has an
  // existing key, and write ALL of them or none. The batch becomes a
  // transaction on every runtime (DynamoDB TransactWriteItems, a SQLite
  // transaction locally), so a losing concurrent writer gets the namespaced
  // Conflict with nothing landed - the batch primitive for claiming a run of
  // consecutive slots in an append-only log.
  ifNotExists?: boolean;

  // Composed into each item's partition key value by the processor; requires a string-typed partition key.
  scope?: string;
};

export const askKeyValueStoreUpsertManyBase = createActionRequester<void>()({
  actionType: KeyValueStoreActionType.UpsertMany,
  errorTypes: [
    'ServiceUnavailable', // DynamoDB internal error / throttling
    'ResourceNotFound', // the underlying table does not exist
    'InvalidScope', // scope is malformed or the store's partition key is not string-typed
    'StoreNotFound', // the store is not declared in the qpq config (misconfiguration)
    // Two items in one batch share a primary key. Rejected up front on every
    // runtime, before anything is written: DynamoDB rejects same-key duplicates
    // only when they land in the same 25-item BatchWriteItem chunk (across chunks
    // the later write silently wins), so without this check the outcome would
    // depend on item position and never reproduce locally.
    'DuplicateKey',
    // A conditional (ifNotExists) batch lost a race on one of its items (it exists, or
    // another write holds it right now); none of the batch was written. Namespaced, not
    // ErrorTypeEnum.Conflict, so retry logic can target the write race specifically
    // without also catching domain-level conflicts.
    'Conflict',
  ],
  getPayload: (keyValueStoreName: string, items: KvsItemRecord[], options?: KeyValueStoreUpsertManyOptions) => ({
    keyValueStoreName,
    items,
    options,
  }),
});

// Generic so callers can pin the item shape they are writing at the call site.
export function* askKeyValueStoreUpsertMany<KvsItem>(
  keyValueStoreName: string,
  items: KvsItem[],
  options?: KeyValueStoreUpsertManyOptions,
): AskResponse<void> {
  return yield* askKeyValueStoreUpsertManyBase(keyValueStoreName, items as KvsItemRecord[], options);
}
