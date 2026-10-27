import { AskResponse } from '../../types/StorySession';
import { createActionRequester } from '../../types/utils/createActionRequester';
import { KeyValueStoreActionType } from './KeyValueStoreActionType';
import { KvsCoreDataType } from './types';

export type KeyValueStoreDeleteOptions = {
  // Composed into the partition key value by the processor; requires a string-typed partition key.
  scope?: string;
};

export const askKeyValueStoreDelete = createActionRequester<void>()({
  actionType: KeyValueStoreActionType.Delete,
  errorTypes: [
    'ServiceUnavailable', // DynamoDB internal error / throttling
    'ResourceNotFound', // the underlying table does not exist
    'InvalidScope', // scope is malformed or the store's partition key is not string-typed
    'StoreNotFound', // the store is not declared in the qpq config (misconfiguration)
  ],
  getPayload: (keyValueStoreName: string, key: KvsCoreDataType, sortKey?: KvsCoreDataType, options?: KeyValueStoreDeleteOptions) => ({
    keyValueStoreName,
    key,
    sortKey,
    options,
  }),
});
