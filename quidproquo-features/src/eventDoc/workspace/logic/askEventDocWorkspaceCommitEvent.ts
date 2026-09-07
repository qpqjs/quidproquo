import { askDateNow, askNewGuid, AskResponse, ErrorTypeEnum, QpqIsoDateTime } from 'quidproquo-core';

import { EventDocApplyEventActionPayload } from '../../actions';
import { EventDocEvent } from '../../models';
import { askUIEventDocWorkspaceApplyEvent } from '../actionCreators/askUIEventDocWorkspaceApplyEvent';
import { askUIEventDocWorkspaceClearError } from '../actionCreators/askUIEventDocWorkspaceClearError';
import { askUIEventDocWorkspaceSetError } from '../actionCreators/askUIEventDocWorkspaceSetError';
import { EventDocWorkspaceSlotBinding } from '../types/EventDocWorkspaceSlotBinding';
import { EventDocWorkspaceSlotOperation } from '../types/EventDocWorkspaceSlotOperation';
import { askEventDocWorkspaceReadState } from './askEventDocWorkspaceReadState';

// The workspace interpretation of askApplyEventDocEvent: record ONE event into the
// bound slot's PENDING buffer (every slot; a local slot's pending simply never
// saves). Local only, no network; Save streams the pending buffer later. Metadata is
// provisional: only `data` + `version` affect the fold, and the backend stamps
// createdBy/createdAt/eventId on save. The validator runs against the slot's FOLDED
// live state (history view + pending, transients excluded) BEFORE anything lands —
// state, not the raw log, so the verdict is right even when the slot holds only the
// events after its snapshot base. A rejection surfaces as slot error state (never
// throws) and the event is dropped. Coalesce + renumber happen atomically in the
// reducer (see createApplyEventUpdater).
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
        // The slot authors at one schema version; every event it commits carries it.
        version: binding.schemaVersion,
        clientMessageId,
        createdBy: { userId: '', userDisplayName: '' },
        createdAt,
        // Placeholder: the reducer stamps the provisional position atomically on apply
        // (createApplyEventUpdater), and the server assigns the real id on save.
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
