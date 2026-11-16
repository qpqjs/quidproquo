import { askKeyValueStoreUpsertWithRetry, AskResponse } from '@qpqjs/core';

import { askEventDocStoreReadOrThrow } from '../context/askEventDocStoreReadOrThrow';
import { EVENT_DOC_SUMMARY_VIEW } from '../definition/types/EventDocLatestViews';
import { EventDocSummaryView } from '../models';
import { EventDocStoredListView } from '../types/EventDocStoredListView';
import { askEventDocResolveScope } from './askEventDocResolveScope';
import { eventDocListViewPk } from './eventDocListViewPk';

/** Bare upsert of a summary view as its lists store row, replacing whatever is stored. Validation lives in the logic layer. */
export function* askEventDocUpsert(view: EventDocSummaryView): AskResponse<void> {
  const { listsStoreName, type } = yield* askEventDocStoreReadOrThrow();
  const scope = yield* askEventDocResolveScope();

  const row: EventDocStoredListView = {
    pk: eventDocListViewPk(EVENT_DOC_SUMMARY_VIEW, type),
    id: view.id,
    updatedAt: view.updatedAt,
    ...(view.deletedAt !== undefined ? { deletedAt: view.deletedAt } : {}),
    eventId: view.eventId,
    state: view,
  };

  yield* askKeyValueStoreUpsertWithRetry(listsStoreName, row, { scope });
}
