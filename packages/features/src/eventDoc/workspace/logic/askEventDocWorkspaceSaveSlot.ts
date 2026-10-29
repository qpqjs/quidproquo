import { askCatch, AskResponse } from '@qpqjs/core';

import { EventDocEvent } from '../../models';
import { askEventDocWorkspaceAppendHistoryEvent } from '../actionCreators/askEventDocWorkspaceAppendHistoryEvent';
import { askEventDocWorkspaceClearError } from '../actionCreators/askEventDocWorkspaceClearError';
import { askEventDocWorkspaceCompact } from '../actionCreators/askEventDocWorkspaceCompact';
import { askEventDocWorkspaceRemovePendingEvent } from '../actionCreators/askEventDocWorkspaceRemovePendingEvent';
import { askEventDocWorkspaceSetError } from '../actionCreators/askEventDocWorkspaceSetError';
import { askEventDocWorkspaceSetSaving } from '../actionCreators/askEventDocWorkspaceSetSaving';
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

  yield* askEventDocWorkspaceSetSaving(slotKey, true);
  yield* askEventDocWorkspaceClearError(slotKey);

  // The saving flag is cleared in askCatch's finally so a throw mid-batch (a resync that
  // fails to rebase, for example) cannot leave the slot stuck in isSaving forever.
  const saveResult = yield* askCatch(
    askEventDocWorkspaceSavePendingEvents(transport, slots, slotKey, documentIdentity, pendingEvents),
    askEventDocWorkspaceSetSaving(slotKey, false),
  );

  if (!saveResult.success) {
    yield* askEventDocWorkspaceSetError(slotKey, { operation: EventDocWorkspaceSlotOperation.save, error: saveResult.error });
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
      yield* askEventDocWorkspaceSetError(slotKey, { operation: EventDocWorkspaceSlotOperation.save, error: result.error });
      break;
    }

    // The server stored the event either way, so it leaves pending. An ack that does not follow the held head means
    // another writer landed events in between: the bootstrap brings them (and this ack) in, and the next pending event
    // saves on top of the corrected base.
    if (isContiguousWithSlotHead(yield* askEventDocWorkspaceReadState(), slotKey, [result.result])) {
      yield* askEventDocWorkspaceAppendHistoryEvent(slotKey, result.result);
      yield* askEventDocWorkspaceCompact(slotKey);
    } else {
      yield* askEventDocWorkspaceResync(transport, slots, slotKey);
    }

    yield* askEventDocWorkspaceRemovePendingEvent(slotKey, result.result.payload.metadata.clientMessageId);
  }
}
