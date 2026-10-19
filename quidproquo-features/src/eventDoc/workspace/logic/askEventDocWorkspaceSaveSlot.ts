import { askCatch, AskResponse } from 'quidproquo-core';

import { askUIEventDocWorkspaceAppendHistoryEvent } from '../actionCreators/askUIEventDocWorkspaceAppendHistoryEvent';
import { askUIEventDocWorkspaceClearError } from '../actionCreators/askUIEventDocWorkspaceClearError';
import { askUIEventDocWorkspaceCompact } from '../actionCreators/askUIEventDocWorkspaceCompact';
import { askUIEventDocWorkspaceRemovePendingEvent } from '../actionCreators/askUIEventDocWorkspaceRemovePendingEvent';
import { askUIEventDocWorkspaceSetError } from '../actionCreators/askUIEventDocWorkspaceSetError';
import { askUIEventDocWorkspaceSetSaving } from '../actionCreators/askUIEventDocWorkspaceSetSaving';
import { EventDocWorkspaceSlotOperation } from '../types/EventDocWorkspaceSlotOperation';
import { EventDocWorkspaceTransport } from '../types/EventDocWorkspaceTransport';
import { askEventDocWorkspaceReadState } from './askEventDocWorkspaceReadState';
import { askEventDocWorkspaceResync } from './askEventDocWorkspaceResync';
import { isContiguousWithSlotHead } from './isContiguousWithSlotHead';
import { toEventDocEventInput } from './toEventDocEventInput';

/**
 * Streams one slot's pending events, each moving into history as it lands. Per-event so an interrupted save leaves only the
 * unsaved tail pending; the backend dedups against the latest event only. Skipped while the slot is already saving.
 */
export function* askEventDocWorkspaceSaveSlot(transport: EventDocWorkspaceTransport, slotKey: string): AskResponse<void> {
  const state = yield* askEventDocWorkspaceReadState();
  const slotState = state.slots[slotKey];
  const documentIdentity = slotState?.documentIdentity;
  const pendingEvents = state.pending[slotKey] ?? [];

  if (!slotState || slotState.isSaving || !documentIdentity || pendingEvents.length === 0) {
    return;
  }

  yield* askUIEventDocWorkspaceSetSaving(slotKey, true);
  yield* askUIEventDocWorkspaceClearError(slotKey);

  for (const pending of pendingEvents) {
    const result = yield* askCatch(transport.askAppendEvent(documentIdentity, toEventDocEventInput(pending)));

    if (!result.success) {
      yield* askUIEventDocWorkspaceSetError(slotKey, { operation: EventDocWorkspaceSlotOperation.save, error: result.error });
      break;
    }

    // The server stored the event either way, so it leaves pending. An ack that does not follow the held head means
    // another writer landed events in between: the bootstrap brings them (and this ack) in, and the next pending event
    // saves on top of the corrected base.
    if (isContiguousWithSlotHead(yield* askEventDocWorkspaceReadState(), slotKey, [result.result])) {
      yield* askUIEventDocWorkspaceAppendHistoryEvent(slotKey, result.result);
      yield* askUIEventDocWorkspaceCompact(slotKey);
    } else {
      yield* askEventDocWorkspaceResync(transport, slotKey);
    }

    yield* askUIEventDocWorkspaceRemovePendingEvent(slotKey, result.result.payload.metadata.clientMessageId);
  }

  yield* askUIEventDocWorkspaceSetSaving(slotKey, false);
}
