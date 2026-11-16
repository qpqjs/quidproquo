import { askKeyValueStoreQuery, AskResponse, kvsEqual, kvsNotExists, QpqPagedData } from '@qpqjs/core';

import { EVENT_DOC_LISTS_NEWEST_FIRST_INDEX } from '../constants/eventDocListsNewestFirstIndex';
import { askEventDocStoreReadOrThrow } from '../context/askEventDocStoreReadOrThrow';
import { EVENT_DOC_LIST_PAGE_SIZE } from '../list/constants/eventDocListPageSize';
import { EventDocStoredListView } from '../types/EventDocStoredListView';
import { askEventDocResolveScope } from './askEventDocResolveScope';
import { eventDocListViewPk } from './eventDocListViewPk';

/** Options for askEventDocListViewPage. */
export type EventDocListViewPageOptions = {
  includeDeleted?: boolean;
  limit?: number;
  nextPageKey?: string;
};

/**
 * One page of one list view across the collection, newest first via the lists store's (pk, updatedAt) index. Soft-deleted rows are
 * removed by a query filter applied after the read, so a page can be short of `limit` with more pages left: page on
 * `nextPageKey`, not count. The index is named because it shares the table's partition key: unnamed, the query would
 * read the table in id order.
 */
export function* askEventDocListViewPage(viewName: string, options?: EventDocListViewPageOptions): AskResponse<QpqPagedData<EventDocStoredListView>> {
  const { listsStoreName, type } = yield* askEventDocStoreReadOrThrow();
  const scope = yield* askEventDocResolveScope();

  return yield* askKeyValueStoreQuery<EventDocStoredListView>(listsStoreName, kvsEqual('pk', eventDocListViewPk(viewName, type)), {
    scope,
    indexName: EVENT_DOC_LISTS_NEWEST_FIRST_INDEX,
    limit: options?.limit ?? EVENT_DOC_LIST_PAGE_SIZE,
    nextPageKey: options?.nextPageKey,
    sortAscending: false,
    filter: options?.includeDeleted ? undefined : kvsNotExists('deletedAt'),
  });
}
