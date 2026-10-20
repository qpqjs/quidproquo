import { askCatch, askMapParallel, AskResponse } from 'quidproquo-core';

import { askUIEventDocWorkspaceAppendHistoryEvents } from '../actionCreators/askUIEventDocWorkspaceAppendHistoryEvents';
import { askUIEventDocWorkspaceClearError } from '../actionCreators/askUIEventDocWorkspaceClearError';
import { askUIEventDocWorkspaceCompact } from '../actionCreators/askUIEventDocWorkspaceCompact';
import { askUIEventDocWorkspaceSetError } from '../actionCreators/askUIEventDocWorkspaceSetError';
import { EventDocWorkspaceSlotFoldsConfig } from '../types/EventDocWorkspaceSlotFoldsConfig';
import { EventDocWorkspaceSlotOperation } from '../types/EventDocWorkspaceSlotOperation';
import { EventDocWorkspaceTransport } from '../types/EventDocWorkspaceTransport';
import { askEventDocWorkspaceReadState } from './askEventDocWorkspaceReadState';
import { askEventDocWorkspaceRebasePending } from './askEventDocWorkspaceRebasePending';
import { askEventDocWorkspaceResync } from './askEventDocWorkspaceResync';
import { getSlotHeadEventId } from './getSlotHeadEventId';
import { isContiguousWithSlotHead } from './isContiguousWithSlotHead';

// afterEventId is exclusive. It falls back to the fold base when the held history is empty, so a slot whose snapshot was
// current does not refetch from event zero.
const getAskRefreshDocumentSlot = (transport: EventDocWorkspaceTransport, slots: EventDocWorkspaceSlotFoldsConfig) =>
  function* askRefreshDocumentSlot(slotKey: string): AskResponse<void> {
    const state = yield* askEventDocWorkspaceReadState();
    const documentIdentity = state.slots[slotKey]?.documentIdentity;

    if (!documentIdentity) {
      return;
    }

    const afterEventId = getSlotHeadEventId(state, slotKey) ?? undefined;

    yield* askUIEventDocWorkspaceClearError(slotKey);

    const result = yield* askCatch(transport.askFetchEvents(documentIdentity, afterEventId));

    if (!result.success) {
      yield* askUIEventDocWorkspaceSetError(slotKey, { operation: EventDocWorkspaceSlotOperation.load, error: result.error });
      return;
    }

    if (result.result.length === 0) {
      return;
    }

    // A tail that does not start at head + 1 cannot be folded on; the bootstrap rebuilds the slot from a known base.
    if (isContiguousWithSlotHead(yield* askEventDocWorkspaceReadState(), slotKey, result.result)) {
      yield* askUIEventDocWorkspaceAppendHistoryEvents(slotKey, result.result);
      yield* askUIEventDocWorkspaceCompact(slotKey);
      yield* askEventDocWorkspaceRebasePending(slots, slotKey);
    } else {
      yield* askEventDocWorkspaceResync(transport, slots, slotKey);
    }
  };

/**
 * Appends the events saved since the last held one to each slot's history, then rebases pending: events that no longer
 * validate against the moved state are dropped and reported on the slot error. Slots with no identity are skipped.
 */
export function* askEventDocWorkspaceRefresh(
  transport: EventDocWorkspaceTransport,
  slots: EventDocWorkspaceSlotFoldsConfig,
  slotKeys: string[],
): AskResponse<void> {
  yield* askMapParallel(slotKeys, getAskRefreshDocumentSlot(transport, slots));
}
