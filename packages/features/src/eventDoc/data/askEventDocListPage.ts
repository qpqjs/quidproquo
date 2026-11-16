import { AskResponse, QpqPagedData } from '@qpqjs/core';

import { askEventDocStoreReadOrThrow } from '../context/askEventDocStoreReadOrThrow';
import { EVENT_DOC_SUMMARY_VIEW } from '../definition/types/EventDocLatestViews';
import { EventDocSummary } from '../models';
import { askEventDocListViewPage, EventDocListViewPageOptions } from './askEventDocListViewPage';
import { toEventDocSummary } from './toEventDocSummary';

/** Options for askEventDocListPage. */
export type EventDocListPageOptions = EventDocListViewPageOptions;

/**
 * One page of the collection's summaries, newest first. A page can be short of `limit` with more pages left (see
 * askEventDocListViewPage): page on `nextPageKey`, not count.
 */
export function* askEventDocListPage<T extends EventDocSummary = EventDocSummary>(options?: EventDocListPageOptions): AskResponse<QpqPagedData<T>> {
  const { type } = yield* askEventDocStoreReadOrThrow();
  const page = yield* askEventDocListViewPage(EVENT_DOC_SUMMARY_VIEW, options);

  return { ...page, items: page.items.map((row) => toEventDocSummary<T>(row, type)) };
}
