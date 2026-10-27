import { askCatch, AskResponse } from '@qpqjs/core';

import { askUIEventDocWorkspaceClearError } from '../actionCreators/askUIEventDocWorkspaceClearError';
import { askUIEventDocWorkspaceCompact } from '../actionCreators/askUIEventDocWorkspaceCompact';
import { askUIEventDocWorkspaceSetError } from '../actionCreators/askUIEventDocWorkspaceSetError';
import { askUIEventDocWorkspaceSetHistoryEvents } from '../actionCreators/askUIEventDocWorkspaceSetHistoryEvents';
import { EventDocWorkspaceSlotFoldsConfig } from '../types/EventDocWorkspaceSlotFoldsConfig';
import { EventDocWorkspaceSlotOperation } from '../types/EventDocWorkspaceSlotOperation';
import { EventDocWorkspaceTransport } from '../types/EventDocWorkspaceTransport';
import { askEventDocWorkspaceReadState } from './askEventDocWorkspaceReadState';
import { askEventDocWorkspaceRebasePending } from './askEventDocWorkspaceRebasePending';

/**
 * Replaces a slot's base and saved history with the server's bootstrap (newest snapshot plus the tail to head), then
 * compacts so the slot holds the state at head and no history. Pending is then rebased: events that no longer validate
 * against the new state are dropped and reported on the slot error, the rest keep folding on top. The recovery for any
 * gap between the held history and the server log, and the plain load for a slot with nothing held. A slot with no
 * identity is skipped; a failed fetch surfaces as a load error.
 */
export function* askEventDocWorkspaceResync(
  transport: EventDocWorkspaceTransport,
  slots: EventDocWorkspaceSlotFoldsConfig,
  slotKey: string,
): AskResponse<void> {
  const state = yield* askEventDocWorkspaceReadState();
  const documentIdentity = state.slots[slotKey]?.documentIdentity;

  if (!documentIdentity) {
    return;
  }

  yield* askUIEventDocWorkspaceClearError(slotKey);

  const result = yield* askCatch(transport.askFetchBootstrap(documentIdentity));

  if (!result.success) {
    yield* askUIEventDocWorkspaceSetError(slotKey, { operation: EventDocWorkspaceSlotOperation.load, error: result.error });
    return;
  }

  yield* askUIEventDocWorkspaceSetHistoryEvents(slotKey, result.result.events, result.result.base);
  yield* askUIEventDocWorkspaceCompact(slotKey);
  yield* askEventDocWorkspaceRebasePending(slots, slotKey);
}
