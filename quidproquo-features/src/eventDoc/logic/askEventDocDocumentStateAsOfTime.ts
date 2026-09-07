import { AskResponse, Nullable, QpqIsoDateTime } from 'quidproquo-core';

import { askEventDocEventIdAsOf } from '../data/askEventDocEventIdAsOf';
import { EventDocDocumentStateAtEvent } from '../models';
import { askEventDocDocumentStateAsOf } from './askEventDocDocumentStateAsOf';

/**
 * The document state as it stood at `clock` — the state an editor would have shown then,
 * drafts and all: this is "latest, as of a time", NOT a published-version lookup, so the
 * doc needs no published version to resolve.
 *
 * That distinction is the point. A `Latest` link is resolved against the moment its
 * *referrer* was published, so the referrer renders the linked doc exactly as its author
 * saw it at publish time — a layout or content item that was still an unpublished draft
 * then is still what gets rendered. Use `askEventDocPublishedVersionAsOf` when a doc's
 * OWN published version is what's wanted.
 *
 * Resolves the clock to a log position (newest event at or before it) and folds
 * snapshot-seeded from there — cost tracks the gap, never the log. Null when the doc has
 * no events at or before the clock. Assumes the store context is provided (wrap in
 * `askEventDocProvideStore`).
 */
export function* askEventDocDocumentStateAsOfTime(id: string, clock: QpqIsoDateTime): AskResponse<Nullable<EventDocDocumentStateAtEvent>> {
  const eventId = yield* askEventDocEventIdAsOf(id, clock);

  if (eventId === null) {
    return null;
  }

  return yield* askEventDocDocumentStateAsOf(id, eventId);
}
