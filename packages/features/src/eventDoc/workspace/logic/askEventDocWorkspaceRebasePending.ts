import { AskResponse, ErrorTypeEnum } from '@qpqjs/core';

import { askUIEventDocWorkspaceSetError } from '../actionCreators/askUIEventDocWorkspaceSetError';
import { askUIEventDocWorkspaceSetPendingEvents } from '../actionCreators/askUIEventDocWorkspaceSetPendingEvents';
import { EventDocWorkspaceSlotFoldsConfig } from '../types/EventDocWorkspaceSlotFoldsConfig';
import { EventDocWorkspaceSlotOperation } from '../types/EventDocWorkspaceSlotOperation';
import { askEventDocWorkspaceReadState } from './askEventDocWorkspaceReadState';
import { getSlotHistoryView } from './getSlotHistoryView';
import { getSlotPending } from './getSlotPending';
import { rebaseSlotPending } from './rebaseSlotPending';

const describeDrop = (count: number, firstReason: string): string =>
  `${count} unsaved ${count === 1 ? 'change was' : 'changes were'} discarded because the document changed: ${firstReason}`;

/**
 * Runs after a slot's stored view moved under its pending buffer (a pull or a resync, never the slot's own save ack):
 * pending events that no longer validate are dropped and the slot error reports how many and why. Nothing changes when
 * every event still applies.
 */
export function* askEventDocWorkspaceRebasePending(slots: EventDocWorkspaceSlotFoldsConfig, slotKey: string): AskResponse<void> {
  const slot = slots[slotKey];
  const state = yield* askEventDocWorkspaceReadState();
  const pending = getSlotPending(state, slotKey);

  if (!slot || pending.length === 0) {
    return;
  }

  const { kept, dropped } = rebaseSlotPending(slot, getSlotHistoryView(state, slotKey), pending);

  if (dropped.length === 0) {
    return;
  }

  yield* askUIEventDocWorkspaceSetPendingEvents(slotKey, kept);
  yield* askUIEventDocWorkspaceSetError(slotKey, {
    operation: EventDocWorkspaceSlotOperation.rebase,
    error: { errorType: ErrorTypeEnum.Invalid, errorText: describeDrop(dropped.length, dropped[0]?.reason ?? 'unknown') },
  });
}
