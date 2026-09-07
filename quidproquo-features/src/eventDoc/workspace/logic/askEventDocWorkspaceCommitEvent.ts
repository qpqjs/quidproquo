import { askDateNow, askNewGuid, AskResponse, ErrorTypeEnum, QpqIsoDateTime } from 'quidproquo-core';

import { EventDocApplyEventActionPayload } from '../../actions';
import { EventDocEvent } from '../../models';
import { askUIEventDocWorkspaceApplyEvent } from '../actionCreators/askUIEventDocWorkspaceApplyEvent';
import { askUIEventDocWorkspaceClearError } from '../actionCreators/askUIEventDocWorkspaceClearError';
import { askUIEventDocWorkspaceSetError } from '../actionCreators/askUIEventDocWorkspaceSetError';
import { EventDocWorkspaceSlotBinding } from '../types/EventDocWorkspaceSlotBinding';
import { EventDocWorkspaceSlotOperation } from '../types/EventDocWorkspaceSlotOperation';
import { askEventDocWorkspaceReadState } from './askEventDocWorkspaceReadState';

/**
 * Records one event into the bound slot's pending buffer (local only, no network). The validator runs against the folded
 * live state (history + pending, transients excluded); a rejection becomes slot error state and the event is dropped. Never throws.
 */
export function* askEventDocWorkspaceCommitEvent(
  binding: EventDocWorkspaceSlotBinding,
  { eventType, data }: EventDocApplyEventActionPayload,
): AskResponse<void> {
  const clientMessageId = yield* askNewGuid();
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
        // Placeholder: the reducer stamps the provisional id on apply and the server assigns the real one on save.
        eventId: 0,
      },
    },
  };

  if (binding.validate) {
    const state = yield* askEventDocWorkspaceReadState();

    const reason = binding.validate(event, binding.getValidationView(state));
    if (reason) {
      yield* askUIEventDocWorkspaceSetError(binding.slotKey, {
        operation: EventDocWorkspaceSlotOperation.validation,
        error: { errorType: ErrorTypeEnum.Invalid, errorText: reason },
      });
      return;
    }
  }

  yield* askUIEventDocWorkspaceClearError(binding.slotKey);
  yield* askUIEventDocWorkspaceApplyEvent(binding.slotKey, event);
}
