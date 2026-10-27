import { AskResponse, Nullable } from '@qpqjs/core';

import { askEventDocDelete } from '../data/askEventDocDelete';
import { askEventDocEventListAll } from '../data/askEventDocEventListAll';
import { askEventDocSummaryViewWrite } from '../data/askEventDocSummaryViewWrite';
import { EventDocSummaryView } from '../models';
import { foldEventDocSummary } from '../summary/foldEventDocSummary';

/**
 * Re-derive the summary row from the whole log and return the view written. The projector's fallback for when the
 * snapshot-seeded fold cannot be trusted (no registered definition, a rewritten log, a fold that produced nothing).
 * Idempotent.
 *
 * An EMPTY log means the document is gone (its events were deleted: an emptied table, a transfer that removed it): the
 * summary row is deleted rather than written as the NO_INIT seed, which would leave a placeholder document listing
 * forever, and null is returned.
 */
export function* askEventDocSummaryRederive(modelId: string): AskResponse<Nullable<EventDocSummaryView>> {
  const events = yield* askEventDocEventListAll(modelId);

  if (events.length === 0) {
    yield* askEventDocDelete(modelId);
    return null;
  }

  const view = foldEventDocSummary(events);

  yield* askEventDocSummaryViewWrite(modelId, view);

  return view;
}
