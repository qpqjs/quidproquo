import { askKeyValueStoreScanAllScopes, AskResponse, QpqPagedData } from '@qpqjs/core';

import { eventDocListsStoreName } from '../constants/eventDocListsStoreName';
import { EVENT_DOC_REPROJECT_WALK_PAGE_SIZE } from '../constants/eventDocReprojectWalkPageSize';
import { EVENT_DOC_SUMMARY_VIEW } from '../definition/types/EventDocLatestViews';
import { EventDocReprojectSource, EventDocReprojectTarget, EventDocSummary } from '../models';
import { EventDocStoredListView } from '../types/EventDocStoredListView';
import { parseEventDocListViewPk } from './parseEventDocListViewPk';

// One document per summary row; a document's other list view rows name it again, so they are passed over.
function* askListsTargetsPage(storeName: string, nextPageKey?: string): AskResponse<QpqPagedData<EventDocReprojectTarget>> {
  const page = yield* askKeyValueStoreScanAllScopes<EventDocStoredListView>(eventDocListsStoreName(storeName), undefined, nextPageKey, {
    limit: EVENT_DOC_REPROJECT_WALK_PAGE_SIZE,
  });

  const items = page.items.flatMap(({ scope, item }): EventDocReprojectTarget[] => {
    const key = parseEventDocListViewPk(item.pk);

    return key?.viewName === EVENT_DOC_SUMMARY_VIEW ? [{ type: key.type, docId: item.id, scope }] : [];
  });

  return { items, nextPageKey: page.nextPageKey };
}

// The legacy summary store holds one row per document, keyed by its type and id.
// TODO: @joe-coady: remove this walk, and EventDocReprojectSource.LegacySummary with it, when the legacy summary store
// is dropped from defineEventDocSummary.
function* askLegacySummaryTargetsPage(storeName: string, nextPageKey?: string): AskResponse<QpqPagedData<EventDocReprojectTarget>> {
  const page = yield* askKeyValueStoreScanAllScopes<Pick<EventDocSummary, 'type' | 'id'>>(storeName, undefined, nextPageKey, {
    limit: EVENT_DOC_REPROJECT_WALK_PAGE_SIZE,
  });

  return { items: page.items.map(({ scope, item }) => ({ type: item.type, docId: item.id, scope })), nextPageKey: page.nextPageKey };
}

/**
 * One page of the documents a collection holds, across every storage scope, each with the scope it lives under. Reads
 * EVERY tenant's rows, so it is for a whole-store job only, never a request. A page can hold fewer documents than rows
 * scanned (even none) with more pages left: page on `nextPageKey`, not count.
 */
export function* askEventDocReprojectTargetsPage(
  storeName: string,
  source: EventDocReprojectSource,
  nextPageKey?: string,
): AskResponse<QpqPagedData<EventDocReprojectTarget>> {
  return source === EventDocReprojectSource.LegacySummary
    ? yield* askLegacySummaryTargetsPage(storeName, nextPageKey)
    : yield* askListsTargetsPage(storeName, nextPageKey);
}
