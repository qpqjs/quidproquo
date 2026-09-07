import { AskResponse, Nullable, QpqIsoDateTime } from 'quidproquo-core';

import { askEventDocEventIdAsOf } from '../data/askEventDocEventIdAsOf';
import { EventDocDocumentStateAtEvent } from '../models';
import { askEventDocDocumentStateAsOf } from './askEventDocDocumentStateAsOf';

/**
 * The document state as it stood at `clock`, drafts included (not a published-version lookup; use
 * askEventDocPublishedVersionAsOf for that). Null when the doc has no events at or before the clock.
 * Assumes the store context is provided.
 */
export function* askEventDocDocumentStateAsOfTime(id: string, clock: QpqIsoDateTime): AskResponse<Nullable<EventDocDocumentStateAtEvent>> {
  const eventId = yield* askEventDocEventIdAsOf(id, clock);

  if (eventId === null) {
    return null;
  }

  return yield* askEventDocDocumentStateAsOf(id, eventId);
}
