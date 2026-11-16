import { AskResponse } from '@qpqjs/core';

import { askEventDocStoreReadOrThrow } from '../context/askEventDocStoreReadOrThrow';
import { EVENT_DOC_SUMMARY_VIEW } from '../definition/types/EventDocLatestViews';
import { EventDocSummary } from '../models';
import { askEventDocListViewAll } from './askEventDocListViewAll';
import { toEventDocSummary } from './toEventDocSummary';

/** Options for askEventDocList. */
export type EventDocListOptions = {
  includeDeleted?: boolean;
};

/** Every summary in the collection, newest first, read and sorted in memory. Prefer askEventDocListPage for large collections. */
export function* askEventDocList<T extends EventDocSummary = EventDocSummary>(options?: EventDocListOptions): AskResponse<T[]> {
  const { type } = yield* askEventDocStoreReadOrThrow();
  const rows = yield* askEventDocListViewAll(EVENT_DOC_SUMMARY_VIEW);

  const items = rows.map((row) => toEventDocSummary<T>(row, type));
  const visible = options?.includeDeleted ? items : items.filter((model) => !model.deletedAt);

  return [...visible].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
