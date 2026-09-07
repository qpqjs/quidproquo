import { EventDocEvent } from '../../models';
import { foldSlotPendingTail } from '../logic/foldSlotPendingTail';
import { getSlotHistoryView } from '../logic/getSlotHistoryView';
import { getSlotPending } from '../logic/getSlotPending';
import { getSlotTransientEvents } from '../logic/getSlotTransientEvents';
import { EventDocWorkspaceSelector } from '../types/EventDocWorkspaceSelectors';
import { EventDocWorkspaceSlotFoldConfig } from '../types/EventDocWorkspaceSlotFoldConfig';

/**
 * One slot's live view: the pending tail, then the transient merge, folded onto the stored accumulator and migrated to latest.
 * The pending fold always runs because the accumulator may sit below latest. Memoized on (history view, pending, transient) identity.
 */
export const createSlotViewSelector = (slotKey: string, slot: EventDocWorkspaceSlotFoldConfig): EventDocWorkspaceSelector<unknown> => {
  let hasCachedView = false;
  let cachedHistoryView: unknown;
  let cachedPending: EventDocEvent[] | undefined;
  let cachedTransientRecord: Record<string, EventDocEvent[]> | undefined;
  let cachedView: unknown;

  return (state) => {
    const historyView = getSlotHistoryView<unknown>(state, slotKey);
    const pending = getSlotPending(state, slotKey);
    const transientRecord = state.transient[slotKey];

    if (hasCachedView && historyView === cachedHistoryView && pending === cachedPending && transientRecord === cachedTransientRecord) {
      return cachedView;
    }

    const transientEvents = getSlotTransientEvents(state, slotKey);
    const viewWithPending = foldSlotPendingTail(slot, historyView, pending);

    cachedHistoryView = historyView;
    cachedPending = pending;
    cachedTransientRecord = transientRecord;
    // Nothing transient: the pending fold already migrated to latest, so skip the second fold.
    cachedView = transientEvents.length === 0 ? viewWithPending : foldSlotPendingTail(slot, viewWithPending, transientEvents);
    hasCachedView = true;

    return cachedView;
  };
};
