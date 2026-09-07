import { AskResponse } from 'quidproquo-core';

import { askEventDocEventListAll } from '../data/askEventDocEventListAll';
import { askEventDocSummaryViewWrite } from '../data/askEventDocSummaryViewWrite';
import { foldEventDocSummary } from '../summary/foldEventDocSummary';

/**
 * Re-derive the summary row from the whole log. The projector's fallback for when the snapshot-seeded fold
 * cannot be trusted (no registered definition, a rewritten log, a fold that produced nothing). Idempotent.
 */
export function* askEventDocSummaryRederive(modelId: string): AskResponse<void> {
  const events = yield* askEventDocEventListAll(modelId);
  const record = foldEventDocSummary(events);

  yield* askEventDocSummaryViewWrite(modelId, record);
}
