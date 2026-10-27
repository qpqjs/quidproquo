import { QpqPagedData } from '../../types/QpqPagedData';
import { AskResponse } from '../../types/StorySession';
import { createActionRequester } from '../../types/utils/createActionRequester';
import { KeyValueStoreActionType } from './KeyValueStoreActionType';
import { KvsQueryOperation } from './types';

// One row and the scope it lives under. `scope` is absent for an unscoped row.
//
// The scope is reported rather than dropped BECAUSE this crosses scopes: a caller that reads
// every tenant's rows in one pass has to know which tenant each belongs to, or anything it
// writes back lands in the wrong partition. Handing back bare items would make silent
// cross-tenant corruption the easy mistake.
export type KvsScopedItem<KvsItem> = {
  scope?: string;
  item: KvsItem;
};

export type KeyValueStoreScanAllScopesOptions = {
  limit?: number;
};

export const askKeyValueStoreScanAllScopesBase = createActionRequester<QpqPagedData<KvsScopedItem<unknown>>>()({
  actionType: KeyValueStoreActionType.ScanAllScopes,
  errorTypes: [
    'ServiceUnavailable', // DynamoDB internal error / throttling
    'ResourceNotFound', // the underlying table does not exist
    'StoreNotFound', // the store is not declared in the qpq config (misconfiguration)
  ],
  getPayload: (
    keyValueStoreName: string,
    filterCondition?: KvsQueryOperation,
    nextPageKey?: string,
    options?: KeyValueStoreScanAllScopesOptions,
  ) => ({ keyValueStoreName, filterCondition, nextPageKey, options }),
});

/**
 * Read EVERY row in a store, across every scope, each paired with the scope it lives under.
 *
 * This deliberately crosses the tenant boundary that the rest of the KVS layer works hard to
 * hold. An ordinary unscoped Scan cannot see scoped rows at all: the translator ANDs on a
 * predicate that excludes them, precisely so one tenant's request can never read another's.
 * That is the right default and nothing about it changes.
 *
 * The exception exists for MIGRATIONS, where the job is "rewrite every row" and any row you
 * cannot see is data you silently leave behind. The alternative is asking the app to
 * enumerate its own tenants and loop, which fails quietly the moment that list is incomplete.
 *
 * So: reach for this only from a migration or an equivalent whole-store operation, never on a
 * request path. Nothing in the framework calls it, and a caller with a user's request in hand
 * has no business using it — scope is what keeps tenants apart, and this steps over it.
 *
 * The scope comes back per row rather than being discarded, so a caller can write each row
 * back where it came from.
 *
 * DRAIN THE PAGE KEY: loop until `nextPageKey` comes back undefined. Every backend pages,
 * including the local one, deliberately so — a backend that returned everything in one call
 * would let a caller stop after the first page, be right locally, and silently skip most of
 * the data deployed. A local run has to be able to prove the loop.
 */
export function* askKeyValueStoreScanAllScopes<KvsItem>(
  keyValueStoreName: string,
  filterCondition?: KvsQueryOperation,
  nextPageKey?: string,
  options?: KeyValueStoreScanAllScopesOptions,
): AskResponse<QpqPagedData<KvsScopedItem<KvsItem>>> {
  return (yield* askKeyValueStoreScanAllScopesBase(keyValueStoreName, filterCondition, nextPageKey, options)) as QpqPagedData<KvsScopedItem<KvsItem>>;
}
