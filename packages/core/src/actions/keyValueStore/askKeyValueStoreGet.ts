import { AskResponse } from '../../types/StorySession';
import { createActionRequester } from '../../types/utils/createActionRequester';
import { KeyValueStoreActionType } from './KeyValueStoreActionType';

export type KeyValueStoreGetOptions = {
  // Composed into the partition key value by the processor; requires a string-typed partition key.
  scope?: string;
};

export const askKeyValueStoreGetBase = createActionRequester<unknown>()({
  actionType: KeyValueStoreActionType.Get,
  errorTypes: [
    'ServiceUnavailable', // DynamoDB internal error / throttling
    'ResourceNotFound', // the underlying table does not exist
    'InvalidScope', // scope is malformed or the store's partition key is not string-typed
    'StoreNotFound', // the store is not declared in the qpq config (misconfiguration)
  ],
  getPayload: (keyValueStoreName: string, key: string, options?: KeyValueStoreGetOptions) => ({ keyValueStoreName, key, options }),
});

// The stored item's shape is only known to the caller, so the base returns unknown and
// this story casts it to what the caller declared.
export function* askKeyValueStoreGet<Value>(keyValueStoreName: string, key: string, options?: KeyValueStoreGetOptions): AskResponse<Value | null> {
  return (yield* askKeyValueStoreGetBase(keyValueStoreName, key, options)) as Value | null;
}
