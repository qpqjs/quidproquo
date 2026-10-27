import { EventDocWorkspaceSetFullHistoryPayload } from '../../effects/EventDocWorkspaceSetFullHistoryEffect';
import { EventDocWorkspaceState } from '../../types/EventDocWorkspaceState';

/** Replaces (or clears) a slot's display history. Nothing folds from it. No-op on an unknown slot. */
export const setFullHistory = (
  state: EventDocWorkspaceState,
  { slotKey, history }: EventDocWorkspaceSetFullHistoryPayload,
): EventDocWorkspaceState => {
  if (!(slotKey in state.slots)) {
    return state;
  }

  return {
    ...state,
    fullHistory: { ...state.fullHistory, [slotKey]: history },
  };
};
