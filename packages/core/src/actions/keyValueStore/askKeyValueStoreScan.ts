import { QpqPagedData } from '../../types/QpqPagedData';
import { AskResponse } from '../../types/StorySession';
import { createActionRequester } from '../../types/utils/createActionRequester';
import { KeyValueStoreActionType } from './KeyValueStoreActionType';
import { KvsQueryOperation } from './types';

export type KeyValueStoreScanOptions = {
  // Accepted but not implemented: no processor applies a TTL to scans.
  ttlInSeconds?: number;
  // Accepted but not implemented: no processor caps the page size of a scan.
  limit?: number;
  // Enforced by the processor as a partition-key prefix filter; requires a string-typed partition key.
  scope?: string;
};

export const askKeyValueStoreScanBase = createActionRequester<QpqPagedData<unknown>>()({
  actionType: KeyValueStoreActionType.Scan,
  errorTypes: [
    'ServiceUnavailable', // DynamoDB internal error / throttling
    'ResourceNotFound', // the underlying table does not exist
    'InvalidScope', // scope is malformed or the store's partition key is not string-typed
    'StoreNotFound', // the store is not declared in the qpq config (misconfiguration)
  ],
  getPayload: (keyValueStoreName: string, filterCondition?: KvsQueryOperation, nextPageKey?: string, options?: KeyValueStoreScanOptions) => ({
    keyValueStoreName,
    filterCondition,
    nextPageKey,
    options,
  }),
});

// The stored item shape is only known to the caller, so the base returns unknown items
// and this story casts the page to what the caller declared.
export function* askKeyValueStoreScan<KvsItem>(
  keyValueStoreName: string,
  filterCondition?: KvsQueryOperation,
  nextPageKey?: string,
  options?: KeyValueStoreScanOptions,
): AskResponse<QpqPagedData<KvsItem>> {
  return (yield* askKeyValueStoreScanBase(keyValueStoreName, filterCondition, nextPageKey, options)) as QpqPagedData<KvsItem>;
}
