import { AskResponse } from '@qpqjs/core';
import { Nullable } from '@qpqjs/core';

import { askEventDocStoreReadOrThrow } from '../context/askEventDocStoreReadOrThrow';
import { EVENT_DOC_SUMMARY_VIEW } from '../definition/types/EventDocLatestViews';
import { EventDocSummary } from '../models';
import { askEventDocListViewGet } from './askEventDocListViewGet';
import { toEventDocSummary } from './toEventDocSummary';

/** The summary by id, or null. Soft-deleted documents are returned as-is. Pass `consistentRead` to see a write of moments ago. */
export function* askEventDocGetById<T extends EventDocSummary = EventDocSummary>(
  id: string,
  options?: { consistentRead?: boolean },
): AskResponse<Nullable<T>> {
  const { type } = yield* askEventDocStoreReadOrThrow();
  const row = yield* askEventDocListViewGet(EVENT_DOC_SUMMARY_VIEW, id, options);

  return row ? toEventDocSummary<T>(row, type) : null;
}
