import { askCatch, askMapParallel, AskResponse } from 'quidproquo-core';

import { askUIEventDocWorkspaceAppendHistoryEvents } from '../actionCreators/askUIEventDocWorkspaceAppendHistoryEvents';
import { askUIEventDocWorkspaceClearError } from '../actionCreators/askUIEventDocWorkspaceClearError';
import { askUIEventDocWorkspaceSetError } from '../actionCreators/askUIEventDocWorkspaceSetError';
import { EventDocWorkspaceSlotOperation } from '../types/EventDocWorkspaceSlotOperation';
import { EventDocWorkspaceTransport } from '../types/EventDocWorkspaceTransport';
import { askEventDocWorkspaceReadState } from './askEventDocWorkspaceReadState';

// afterEventId is exclusive. It falls back to the fold base when the held history is empty, so a slot whose snapshot was
// current does not refetch from event zero.
const getAskRefreshDocumentSlot = (transport: EventDocWorkspaceTransport) =>
  function* askRefreshDocumentSlot(slotKey: string): AskResponse<void> {
    const state = yield* askEventDocWorkspaceReadState();
    const documentIdentity = state.slots[slotKey]?.documentIdentity;

    if (!documentIdentity) {
      return;
    }

    const history = state.history[slotKey] ?? [];
    const lastEvent = history[history.length - 1];
    const afterEventId = lastEvent?.payload.metadata.eventId ?? state.bases[slotKey]?.eventId;

    yield* askUIEventDocWorkspaceClearError(slotKey);

    const result = yield* askCatch(transport.askFetchEvents(documentIdentity, afterEventId));

    if (!result.success) {
      yield* askUIEventDocWorkspaceSetError(slotKey, { operation: EventDocWorkspaceSlotOperation.load, error: result.error });
      return;
    }

    if (result.result.length > 0) {
      yield* askUIEventDocWorkspaceAppendHistoryEvents(slotKey, result.result);
    }
  };

/**
 * Appends the events saved since the last held one to each slot's history; pending stays intact. Slots with no identity
 * are skipped.
 */
export function* askEventDocWorkspaceRefresh(transport: EventDocWorkspaceTransport, slotKeys: string[]): AskResponse<void> {
  yield* askMapParallel(slotKeys, getAskRefreshDocumentSlot(transport));
}
