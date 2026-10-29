import { askDateNow, askGuidNew, AskResponse, QpqIsoDateTime } from '@qpqjs/core';

import { EventDocApplyTransientEventActionPayload } from '../../actions';
import { EventDocEvent } from '../../models';
import { askEventDocWorkspaceApplyTransientEvent } from '../actionCreators/askEventDocWorkspaceApplyTransientEvent';
import { EventDocWorkspaceSlotBinding } from '../types/EventDocWorkspaceSlotBinding';

/**
 * Records one event into the bound slot's transient group under transientKey. No validation: transients never save.
 * They are ordered by createdAt at read, so eventId stays 0.
 */
export function* askEventDocWorkspaceCommitTransientEvent(
  binding: EventDocWorkspaceSlotBinding,
  { transientKey, eventType, data }: EventDocApplyTransientEventActionPayload,
): AskResponse<void> {
  const clientMessageId = yield* askGuidNew();
  const createdAt = (yield* askDateNow()) as QpqIsoDateTime;

  const event: EventDocEvent = {
    type: eventType,
    payload: {
      data,
      metadata: {
        version: binding.schemaVersion,
        clientMessageId,
        createdBy: { userId: '', userDisplayName: '' },
        createdAt,
        eventId: 0,
      },
    },
  };

  yield* askEventDocWorkspaceApplyTransientEvent(binding.slotKey, transientKey, event);
}
