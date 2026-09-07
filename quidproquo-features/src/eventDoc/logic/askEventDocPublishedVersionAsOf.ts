import { AskResponse } from 'quidproquo-core';
import { Nullable, QpqIsoDateTime } from 'quidproquo-core';

import { askEventDocGetById } from '../data/askEventDocGetById';
import { EventDocVersionState } from '../models';
import { effectiveAsOf } from './selectors/effectiveAsOf';
import { askEventDocDocumentStateAsOf } from './askEventDocDocumentStateAsOf';

/**
 * The version effective at `clock` (keyed on `effectiveFrom`) with the document state at that version's eventId.
 * Null when the doc is missing or deleted, nothing is effective yet, or the version's events are gone. Assumes the store context.
 */
export function* askEventDocPublishedVersionAsOf(id: string, clock: QpqIsoDateTime): AskResponse<Nullable<EventDocVersionState>> {
  const summary = yield* askEventDocGetById(id);
  if (!summary || summary.deletedAt) {
    return null;
  }

  const version = effectiveAsOf(summary, clock);
  if (!version) {
    return null;
  }

  const stateAtVersion = yield* askEventDocDocumentStateAsOf(id, version.eventId);
  if (!stateAtVersion) {
    return null;
  }

  return { version, state: stateAtVersion.state };
}
