import { QpqPagedData } from '../../types/QpqPagedData';
import { AskResponse } from '../../types/StorySession';
import { createActionRequester } from '../../types/utils/createActionRequester';
import { KeyValueStoreActionType } from './KeyValueStoreActionType';
import { KvsQueryOperation } from './types';

export type KeyValueStoreQueryOptions = {
  // Accepted but not implemented: no processor applies a TTL to query results.
  ttlInSeconds?: number;
  sortAscending?: boolean;
  limit?: number;
  nextPageKey?: string;
  filter?: KvsQueryOperation;
  // Composed into partition-key conditions by the processor; requires a string-typed partition key.
  scope?: string;
  // Query the declared index with this name (which defaults to its partition key attribute) and read in
  // its sort order. Without it the table, or else the first index, whose keys cover the key condition
  // serves it, so an index sharing the table's keys is only used when named here.
  indexName?: string;
  // Read the writer's own most recent writes, at the cost of a slower and (on DynamoDB) doubly-charged
  // read.
  //
  // Default reads are EVENTUALLY consistent, which is right for a viewer and wrong for a caller that just
  // wrote and is now reading back to decide something. That case is not hypothetical: a flow run appends
  // its terminal event and immediately re-lists the log to fold the outcome, and under load the terminal
  // event is intermittently not yet visible — so a run that succeeded reads back as having no outcome at
  // all, with nothing recorded to explain it.
  //
  // Use it for read-your-own-writes and for any fold used as a COORDINATION primitive (deciding "am I
  // last", "did this finish"). Do not use it for ordinary reads.
  consistentRead?: boolean;
};

export const askKeyValueStoreQueryBase = createActionRequester<QpqPagedData<unknown>>()({
  actionType: KeyValueStoreActionType.Query,
  errorTypes: [
    'ServiceUnavailable', // DynamoDB internal error / throttling
    'ResourceNotFound', // the underlying table does not exist
    'InvalidScope', // scope is malformed or the store's partition key is not string-typed
    'StoreNotFound', // the store is not declared in the qpq config (misconfiguration)
    'IndexNotFound', // `indexName` names an index the store doesn't declare (misconfiguration)
  ],
  getPayload: (keyValueStoreName: string, keyCondition: KvsQueryOperation, options?: KeyValueStoreQueryOptions) => ({
    keyValueStoreName,
    keyCondition,
    options,
  }),
});

// The stored item shape is only known to the caller, so the base returns unknown items
// and this story casts the page to what the caller declared.
export function* askKeyValueStoreQuery<KvsItem>(
  keyValueStoreName: string,

  keyCondition: KvsQueryOperation,
  options?: KeyValueStoreQueryOptions,
): AskResponse<QpqPagedData<KvsItem>> {
  return (yield* askKeyValueStoreQueryBase(keyValueStoreName, keyCondition, options)) as QpqPagedData<KvsItem>;
}
