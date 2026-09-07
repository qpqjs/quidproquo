import { askCatch, AskResponse } from 'quidproquo-core';

import { askUIEventDocWorkspaceAppendHistoryEvent } from '../actionCreators/askUIEventDocWorkspaceAppendHistoryEvent';
import { askUIEventDocWorkspaceClearError } from '../actionCreators/askUIEventDocWorkspaceClearError';
import { askUIEventDocWorkspaceRemovePendingEvent } from '../actionCreators/askUIEventDocWorkspaceRemovePendingEvent';
import { askUIEventDocWorkspaceSetError } from '../actionCreators/askUIEventDocWorkspaceSetError';
import { askUIEventDocWorkspaceSetSaving } from '../actionCreators/askUIEventDocWorkspaceSetSaving';
import { EventDocWorkspaceSlotOperation } from '../types/EventDocWorkspaceSlotOperation';
import { EventDocWorkspaceTransport } from '../types/EventDocWorkspaceTransport';
import { askEventDocWorkspaceReadState } from './askEventDocWorkspaceReadState';
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

    yield* askUIEventDocWorkspaceAppendHistoryEvent(slotKey, result.result);
    yield* askUIEventDocWorkspaceRemovePendingEvent(slotKey, result.result.payload.metadata.clientMessageId);
  }

  yield* askUIEventDocWorkspaceSetSaving(slotKey, false);
}
