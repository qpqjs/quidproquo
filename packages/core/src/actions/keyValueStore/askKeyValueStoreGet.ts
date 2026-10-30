import { createActionRequester } from '../../logic/actions/createActionRequester';
import { Nullable } from '../../types/Nullable';
import { AskResponse } from '../../types/StorySession';
import { KeyValueStoreActionType } from './KeyValueStoreActionType';

export type KeyValueStoreGetOptions = {
  // Composed into the partition key value by the processor; requires a string-typed partition key.
  scope?: string;
};

export const askKeyValueStoreGetBase = createActionRequester<unknown>()({
  actionType: KeyValueStoreActionType.Get,
  errorTypes: [
    'Throttled', // the store is throttling or failed internally; transient
    'ResourceNotFound', // the underlying table does not exist
    'InvalidScope', // scope is malformed or the store's partition key is not string-typed
    'StoreNotFound', // the store is not declared in the qpq config (misconfiguration)
  ],
  getPayload: (keyValueStoreName: string, key: string, options?: KeyValueStoreGetOptions) => ({ keyValueStoreName, key, options }),
});

// The stored item's shape is only known to the caller, so the base returns unknown and
// this story casts it to what the caller declared.
function* askKeyValueStoreGetTyped<Value>(keyValueStoreName: string, key: string, options?: KeyValueStoreGetOptions): AskResponse<Nullable<Value>> {
  return (yield* askKeyValueStoreGetBase(keyValueStoreName, key, options)) as Nullable<Value>;
}

/** Carries the base requester's `errorType` catalog so callers can match on it. */
export const askKeyValueStoreGet = Object.assign(askKeyValueStoreGetTyped, { errorType: askKeyValueStoreGetBase.errorType });
