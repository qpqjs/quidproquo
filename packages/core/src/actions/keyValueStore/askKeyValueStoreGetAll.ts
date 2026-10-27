import { AskResponse } from '../../types/StorySession';
import { createActionRequester } from '../../types/utils/createActionRequester';
import { KeyValueStoreActionType } from './KeyValueStoreActionType';

export type KeyValueStoreGetAllOptions = {
  // Enforced by the processor as a partition-key prefix filter; requires a string-typed partition key.
  scope?: string;
};

export const askKeyValueStoreGetAllBase = createActionRequester<unknown[]>()({
  actionType: KeyValueStoreActionType.GetAll,
  errorTypes: [
    'ServiceUnavailable', // DynamoDB internal error / throttling
    'ResourceNotFound', // the underlying table does not exist
    'InvalidScope', // scope is malformed or the store's partition key is not string-typed
    'StoreNotFound', // the store is not declared in the qpq config (misconfiguration)
  ],
  getPayload: (keyValueStoreName: string, options?: KeyValueStoreGetAllOptions) => ({ keyValueStoreName, options }),
});

// The stored item shape is only known to the caller, so the base returns unknown[] and
// this story casts it to what the caller declared.
export function* askKeyValueStoreGetAll<Value>(keyValueStoreName: string, options?: KeyValueStoreGetAllOptions): AskResponse<Value[]> {
  return (yield* askKeyValueStoreGetAllBase(keyValueStoreName, options)) as Value[];
}
