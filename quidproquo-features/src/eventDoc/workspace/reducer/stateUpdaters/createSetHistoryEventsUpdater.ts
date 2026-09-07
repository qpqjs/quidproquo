import { EventDocWorkspaceSetHistoryEventsPayload } from '../../effects/EventDocWorkspaceSetHistoryEventsEffect';
import { EventDocWorkspaceSlotFoldsConfig } from '../../types/EventDocWorkspaceSlotFoldsConfig';
import { EventDocWorkspaceState } from '../../types/EventDocWorkspaceState';
import { foldSlotHistory } from './foldSlotHistory';

/**
 * Replaces a slot's saved log and base together and refolds the stored accumulator from the base. No-op on an unknown slot:
 * keys are fixed at definition time.
 */
export const createSetHistoryEventsUpdater =
  (slots: EventDocWorkspaceSlotFoldsConfig) =>
  (state: EventDocWorkspaceState, { slotKey, events, base }: EventDocWorkspaceSetHistoryEventsPayload): EventDocWorkspaceState => {
    const slot = slots[slotKey];

    if (!(slotKey in state.slots) || !slot) {
      return state;
    }

    return {
      ...state,
      history: { ...state.history, [slotKey]: events },
      bases: { ...state.bases, [slotKey]: base ?? null },
      // The replaced log may belong to a different document, so the display history reloads on next request.
      fullHistory: { ...state.fullHistory, [slotKey]: null },
      historyViews: { ...state.historyViews, [slotKey]: foldSlotHistory(slot, events, base ?? null) },
    };
  };
