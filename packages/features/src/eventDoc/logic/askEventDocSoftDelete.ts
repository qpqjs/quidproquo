import { AskResponse } from 'quidproquo-core';

import { EventDocEffect, EventDocEventActor, EventDocSummary } from '../models';
import { askEventDocAppendServerEvent } from './askEventDocAppendServerEvent';
import { askEventDocGetByIdOrThrow } from './askEventDocGetByIdOrThrow';

/**
 * Soft-delete by appending a Delete event; versions and blob claims are untouched so askEventDocRestore can undo it.
 * The validator rejects deleting an already-deleted document. `schemaVersion` is the caller's, like any other event.
 */
export function* askEventDocSoftDelete(id: string, updatedBy: string, schemaVersion: number): AskResponse<EventDocSummary> {
  const actor: EventDocEventActor = { userId: updatedBy, userDisplayName: updatedBy };

  yield* askEventDocAppendServerEvent(id, EventDocEffect.Delete, undefined, schemaVersion, actor);

  return yield* askEventDocGetByIdOrThrow(id);
}
