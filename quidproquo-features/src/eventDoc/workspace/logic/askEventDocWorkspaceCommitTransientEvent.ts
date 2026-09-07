import { askDateNow, askNewGuid, AskResponse, QpqIsoDateTime } from 'quidproquo-core';

import { EventDocApplyTransientEventActionPayload } from '../../actions';
import { EventDocEvent } from '../../models';
import { askUIEventDocWorkspaceApplyTransientEvent } from '../actionCreators/askUIEventDocWorkspaceApplyTransientEvent';
import { EventDocWorkspaceSlotBinding } from '../types/EventDocWorkspaceSlotBinding';

// The workspace interpretation of askApplyTransientEventDocEvent: record ONE event
// into the bound slot's TRANSIENT group under its transientKey. Same guid/date/
// schemaVersion stamping as the ordinary commit (document-slot folds still
// version-guard at read), but NO validation and no clear-error: validators guard the
// integrity of the to-be-saved log, and transient never saves — it is dropped by key,
// not persisted. `createdAt` is load-bearing here: transient ordering at read is by
// time (see getSlotTransientEvents), not by event id.
export function* askEventDocWorkspaceCommitTransientEvent(
  binding: EventDocWorkspaceSlotBinding,
  { transientKey, eventType, data }: EventDocApplyTransientEventActionPayload,
): AskResponse<void> {
  const clientMessageId = yield* askNewGuid();
  const createdAt = (yield* askDateNow()) as QpqIsoDateTime;

  const event: EventDocEvent = {
    type: eventType,
    payload: {
      data,
      metadata: {
        // The slot authors at one schema version; every event it commits carries it.
        version: binding.schemaVersion,
        clientMessageId,
        createdBy: { userId: '', userDisplayName: '' },
        createdAt,
        // Transient events never save and are ordered by createdAt at read, so they hold
        // no log position.
        eventId: 0,
      },
    },
  };

  yield* askUIEventDocWorkspaceApplyTransientEvent(binding.slotKey, transientKey, event);
}
