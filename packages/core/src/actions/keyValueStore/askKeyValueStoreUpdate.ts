import { createActionRequester } from '../../logic/actions/createActionRequester';
import { AskResponse } from '../../types/StorySession';
import { KeyValueStoreActionType } from './KeyValueStoreActionType';
import { KvsCoreDataType, KvsQueryOperation, KvsUpdate } from './types';

export type KeyValueStoreUpdateOptions = {
  // Composed into the partition key value by the processor; requires a string-typed partition key.
  scope?: string;
  // Evaluated against the item as stored before the update; when false nothing is written and the
  // action fails with ConditionFailed. A missing item evaluates as having no attributes, so a
  // NotExists leg passes for it. Same vocabulary as a query filter.
  condition?: KvsQueryOperation;
};

export const askKeyValueStoreUpdateBase = createActionRequester<unknown>()({
  actionType: KeyValueStoreActionType.Update,
  errorTypes: [
    'ServiceUnavailable', // the store is throttling or failed internally; transient
    'ResourceNotFound', // the underlying table does not exist
    'InvalidScope', // scope is malformed or the store's partition key is not string-typed
    'StoreNotFound', // the store is not declared in the qpq config (misconfiguration)
    // The write's `condition` was false against the stored item, so nothing was written. Final for
    // this attempt and distinct from Upsert's Conflict: a caller guarding a watermark treats it as
    // "something newer is already stored", not as a race to retry.
    'ConditionFailed',
  ],
  getPayload: (
    keyValueStoreName: string,
    updates: KvsUpdate,
    key: KvsCoreDataType,
    sortKey?: KvsCoreDataType,
    options?: KeyValueStoreUpdateOptions,
  ) => ({ keyValueStoreName, key, sortKey, updates, options }),
});

// The updated item's shape is only known to the caller, so the base returns unknown and
// this story casts it to what the caller declared.
export function* askKeyValueStoreUpdate<Value>(
  keyValueStoreName: string,

  updates: KvsUpdate,

  key: KvsCoreDataType,
  sortKey?: KvsCoreDataType,

  options?: KeyValueStoreUpdateOptions,
): AskResponse<Value> {
  return (yield* askKeyValueStoreUpdateBase(keyValueStoreName, updates, key, sortKey, options)) as Value;
}
