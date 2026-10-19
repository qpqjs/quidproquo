import { askCatch, AskResponse } from 'quidproquo-core';

import { askUIEventDocWorkspaceClearError } from '../actionCreators/askUIEventDocWorkspaceClearError';
import { askUIEventDocWorkspaceCompact } from '../actionCreators/askUIEventDocWorkspaceCompact';
import { askUIEventDocWorkspaceSetError } from '../actionCreators/askUIEventDocWorkspaceSetError';
import { askUIEventDocWorkspaceSetHistoryEvents } from '../actionCreators/askUIEventDocWorkspaceSetHistoryEvents';
import { EventDocWorkspaceSlotOperation } from '../types/EventDocWorkspaceSlotOperation';
import { EventDocWorkspaceTransport } from '../types/EventDocWorkspaceTransport';
import { askEventDocWorkspaceReadState } from './askEventDocWorkspaceReadState';

/**
 * Replaces a slot's base and saved history with the server's bootstrap (newest snapshot plus the tail to head), then
 * compacts so the slot holds the state at head and no history. Pending is untouched and keeps folding on top. The recovery for any gap between the held history and the server log, and the plain
 * load for a slot with nothing held. A slot with no identity is skipped; a failed fetch surfaces as a load error.
 */
export function* askEventDocWorkspaceResync(transport: EventDocWorkspaceTransport, slotKey: string): AskResponse<void> {
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
}
