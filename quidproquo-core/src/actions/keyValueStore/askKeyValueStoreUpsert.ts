import { AskResponse } from '../../types/StorySession';
import { createActionRequester } from '../../types/utils/createActionRequester';
import { KeyValueStoreActionType } from './KeyValueStoreActionType';
import { KvsItemRecord } from './types';

export type KeyValueStoreUpsertOptions = {
  ttlInSeconds?: number; // Time-to-live in seconds

  // Conditional insert: only write when no item with the same key exists.
  // A losing concurrent writer gets ErrorTypeEnum.Conflict instead of silently
  // overwriting — the primitive for optimistic-concurrency schemes (e.g.
  // append-only event logs where the sort key is a claimed index).
  ifNotExists?: boolean;

  // Composed into the item's partition key value by the processor; requires a string-typed partition key.
  scope?: string;
};

export const askKeyValueStoreUpsertBase = createActionRequester<void>()({
  actionType: KeyValueStoreActionType.Upsert,
  errorTypes: [
    'ServiceUnavailable', // DynamoDB internal error / throttling
    'ResourceNotFound', // the underlying table does not exist
    // A conditional (ifNotExists) write lost to an existing item. Final: the slot is taken.
    // Namespaced, not ErrorTypeEnum.Conflict, so retry logic can target the write race
    // specifically without also catching domain-level conflicts.
    'Conflict',
    // Another write (a transaction in flight) holds the item right now. Transient: the item
    // may still be absent once it settles, so this is a retry, never "already exists".
    // askKeyValueStoreUpsertWithRetry retries it.
    'WriteContention',
    'InvalidScope', // scope is malformed or the store's partition key is not string-typed
    'StoreNotFound', // the store is not declared in the qpq config (misconfiguration)
  ],
  getPayload: (keyValueStoreName: string, item: KvsItemRecord, options?: KeyValueStoreUpsertOptions) => ({ keyValueStoreName, item, options }),
});

// Generic so callers can pin the item shape they are writing at the call site.
export function* askKeyValueStoreUpsert<KvsItem>(keyValueStoreName: string, item: KvsItem, options?: KeyValueStoreUpsertOptions): AskResponse<void> {
  return yield* askKeyValueStoreUpsertBase(keyValueStoreName, item as KvsItemRecord, options);
}
