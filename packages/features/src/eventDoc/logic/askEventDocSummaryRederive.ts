import { AskResponse, Nullable } from '@qpqjs/core';

import { askEventDocEventListAll } from '../data/askEventDocEventListAll';
import { askEventDocListViewWrite } from '../data/askEventDocListViewWrite';
import { EVENT_DOC_SUMMARY_VIEW } from '../definition/types/EventDocLatestViews';
import { EventDocSummaryView } from '../models';
import { foldEventDocSummary } from '../summary/logic/foldEventDocSummary';
import { askEventDocListViewsDelete } from './askEventDocListViewsDelete';

/**
 * Re-derive the summary row from the whole log and return the view written. The projector's fallback for when it has
 * no definition's fold to run or cannot trust a snapshot-seeded one (no registered definition, a rewritten log, a fold
 * that produced nothing). Idempotent. Only the summary is rewritten: it is the one list view that folds without a
 * definition.
 *
 * An EMPTY log means the document is gone (its events were deleted: an emptied table, a transfer that removed it):
 * every list view row is deleted rather than an unfolded summary written, which would leave a placeholder document
 * listing forever, and null is returned.
 */
export function* askEventDocSummaryRederive(modelId: string): AskResponse<Nullable<EventDocSummaryView>> {
  const events = yield* askEventDocEventListAll(modelId);
  const head = events[events.length - 1];

  if (!head) {
    yield* askEventDocListViewsDelete(modelId);
    return null;
  }

  const view = foldEventDocSummary(events);

  // Not authoritative: this fold knows no doc type's own rules, so it must not replace a row a projection wrote at the same event.
  yield* askEventDocListViewWrite(modelId, EVENT_DOC_SUMMARY_VIEW, head.payload.metadata.eventId, view);

  return view;
}
