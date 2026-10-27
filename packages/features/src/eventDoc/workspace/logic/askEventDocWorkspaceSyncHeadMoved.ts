import { AskResponse } from '@qpqjs/core';

import { EventDocWorkspaceSlotFoldsConfig } from '../types/EventDocWorkspaceSlotFoldsConfig';
import { EventDocWorkspaceTransport } from '../types/EventDocWorkspaceTransport';
import { askEventDocWorkspaceReadState } from './askEventDocWorkspaceReadState';
import { askEventDocWorkspaceRefresh } from './askEventDocWorkspaceRefresh';
import { getSlotHeadEventId } from './getSlotHeadEventId';

/**
 * Answers a head-moved push for one slot with a tail pull, which itself falls back to a resync on a gap. Nothing is
 * pulled when the slot already holds headEventId, when the push carries the clientMessageId of an event still pending
 * here (the slot's own save; its ack brings the event in), or while the slot is saving (the ack's contiguity check
 * catches anything another writer landed). A slot with no identity is skipped.
 */
export function* askEventDocWorkspaceSyncHeadMoved(
  transport: EventDocWorkspaceTransport,
  slots: EventDocWorkspaceSlotFoldsConfig,
  slotKey: string,
  headEventId: number,
  clientMessageId?: string,
): AskResponse<void> {
  const state = yield* askEventDocWorkspaceReadState();
  const slotState = state.slots[slotKey];

  if (!slotState?.documentIdentity || slotState.isSaving) {
    return;
  }

  const isOwnSave =
    clientMessageId !== undefined && (state.pending[slotKey] ?? []).some((event) => event.payload.metadata.clientMessageId === clientMessageId);
  const heldHead = getSlotHeadEventId(state, slotKey);

  if (isOwnSave || (heldHead !== null && headEventId <= heldHead)) {
    return;
  }

  yield* askEventDocWorkspaceRefresh(transport, slots, [slotKey]);
}
