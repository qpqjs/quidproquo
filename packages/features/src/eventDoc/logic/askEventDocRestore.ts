import { AskResponse } from 'quidproquo-core';

import { EventDocEffect, EventDocEventActor, EventDocSummary } from '../models';
import { askEventDocAppendServerEvent } from './askEventDocAppendServerEvent';
import { askEventDocGetByIdOrThrow } from './askEventDocGetByIdOrThrow';

/** Undo a soft delete by appending a Restore event. The validator rejects restoring a document that is not deleted. */
export function* askEventDocRestore(id: string, updatedBy: string, schemaVersion: number): AskResponse<EventDocSummary> {
  const actor: EventDocEventActor = { userId: updatedBy, userDisplayName: updatedBy };

  yield* askEventDocAppendServerEvent(id, EventDocEffect.Restore, undefined, schemaVersion, actor);

  return yield* askEventDocGetByIdOrThrow(id);
}
