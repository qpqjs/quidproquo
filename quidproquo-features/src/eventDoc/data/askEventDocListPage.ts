import { askKeyValueStoreQuery, AskResponse, kvsEqual, kvsNotExists, QpqPagedData } from 'quidproquo-core';

import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { EVENT_DOC_LIST_PAGE_SIZE } from '../list/constants/eventDocListPageSize';
import { EventDocSummary } from '../models';
import { askEventDocResolveScope } from './askEventDocResolveScope';

export type EventDocListPageOptions = {
  includeDeleted?: boolean;
  limit?: number;
  nextPageKey?: string;
};

/**
 * One page of the collection, newest first via the (type, updatedAt) index. Soft-deleted rows are removed by a query
 * filter applied after the read, so a page can be short of `limit` with more pages left: page on `nextPageKey`, not count.
 */
export function* askEventDocListPage<T extends EventDocSummary = EventDocSummary>(options?: EventDocListPageOptions): AskResponse<QpqPagedData<T>> {
  const { storeName, type } = yield* askEventDocResolveStore();
  const scope = yield* askEventDocResolveScope();

  return yield* askKeyValueStoreQuery<T>(storeName, kvsEqual('type', type), {
    scope,
    limit: options?.limit ?? EVENT_DOC_LIST_PAGE_SIZE,
    nextPageKey: options?.nextPageKey,
    sortAscending: false,
    filter: options?.includeDeleted ? undefined : kvsNotExists('deletedAt'),
  });
}
