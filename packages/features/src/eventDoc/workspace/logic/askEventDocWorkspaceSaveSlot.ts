import { askCatch, AskResponse } from '@qpqjs/core';

import { EventDocEvent } from '../../models';
import { askUIEventDocWorkspaceAppendHistoryEvent } from '../actionCreators/askUIEventDocWorkspaceAppendHistoryEvent';
import { askUIEventDocWorkspaceClearError } from '../actionCreators/askUIEventDocWorkspaceClearError';
import { askUIEventDocWorkspaceCompact } from '../actionCreators/askUIEventDocWorkspaceCompact';
import { askUIEventDocWorkspaceRemovePendingEvent } from '../actionCreators/askUIEventDocWorkspaceRemovePendingEvent';
import { askUIEventDocWorkspaceSetError } from '../actionCreators/askUIEventDocWorkspaceSetError';
import { askUIEventDocWorkspaceSetSaving } from '../actionCreators/askUIEventDocWorkspaceSetSaving';
import { EventDocWorkspaceDocumentIdentity } from '../types/EventDocWorkspaceDocumentIdentity';
import { EventDocWorkspaceSlotFoldsConfig } from '../types/EventDocWorkspaceSlotFoldsConfig';
import { EventDocWorkspaceSlotOperation } from '../types/EventDocWorkspaceSlotOperation';
import { EventDocWorkspaceTransport } from '../types/EventDocWorkspaceTransport';
import { askEventDocWorkspaceReadState } from './askEventDocWorkspaceReadState';
import { askEventDocWorkspaceResync } from './askEventDocWorkspaceResync';
import { getSlotPending } from './getSlotPending';
import { isContiguousWithSlotHead } from './isContiguousWithSlotHead';
import { toEventDocEventInput } from './toEventDocEventInput';

const isStillPending = (pending: EventDocEvent[], clientMessageId: string | undefined): boolean =>
  pending.some((event) => event.payload.metadata.clientMessageId === clientMessageId);

/**
 * Streams one slot's pending events, each moving into history as it lands. Per-event so an interrupted save leaves only the
 * unsaved tail pending; the backend dedups against the latest event only. Skipped while the slot is already saving.
 */
export function* askEventDocWorkspaceSaveSlot(
  transport: EventDocWorkspaceTransport,
  slots: EventDocWorkspaceSlotFoldsConfig,
  slotKey: string,
): AskResponse<void> {
  const state = yield* askEventDocWorkspaceReadState();
  const slotState = state.slots[slotKey];
  const documentIdentity = slotState?.documentIdentity;
  const pendingEvents = state.pending[slotKey] ?? [];

  if (!slotState || slotState.isSaving || !documentIdentity || pendingEvents.length === 0) {
    return;
  }

  yield* askUIEventDocWorkspaceSetSaving(slotKey, true);
  yield* askUIEventDocWorkspaceClearError(slotKey);

  // The saving flag is cleared in askCatch's finally so a throw mid-batch (a resync that
  // fails to rebase, for example) cannot leave the slot stuck in isSaving forever.
  const saveResult = yield* askCatch(
    askEventDocWorkspaceSavePendingEvents(transport, slots, slotKey, documentIdentity, pendingEvents),
    askUIEventDocWorkspaceSetSaving(slotKey, false),
  );

  if (!saveResult.success) {
    yield* askUIEventDocWorkspaceSetError(slotKey, { operation: EventDocWorkspaceSlotOperation.save, error: saveResult.error });
  }
}

function* askEventDocWorkspaceSavePendingEvents(
  transport: EventDocWorkspaceTransport,
  slots: EventDocWorkspaceSlotFoldsConfig,
  slotKey: string,
  documentIdentity: EventDocWorkspaceDocumentIdentity,
  pendingEvents: EventDocEvent[],
): AskResponse<void> {
  for (const pending of pendingEvents) {
    // A resync below rebases pending, so a later event in this batch may have been dropped since the loop started.
    if (!isStillPending(getSlotPending(yield* askEventDocWorkspaceReadState(), slotKey), pending.payload.metadata.clientMessageId)) {
      continue;
    }

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
      yield* askEventDocWorkspaceResync(transport, slots, slotKey);
    }

    yield* askUIEventDocWorkspaceRemovePendingEvent(slotKey, result.result.payload.metadata.clientMessageId);
  }
}
