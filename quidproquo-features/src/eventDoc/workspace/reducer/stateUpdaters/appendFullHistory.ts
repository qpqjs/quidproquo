import { EventDocWorkspaceAppendFullHistoryPayload } from '../../effects/EventDocWorkspaceAppendFullHistoryEffect';
import { EventDocWorkspaceState } from '../../types/EventDocWorkspaceState';

/**
 * Appends one older page to a slot's display history and advances the cursor. No-op when nothing is loaded yet or on an
 * unknown slot.
 */
export const appendFullHistory = (
  state: EventDocWorkspaceState,
  { slotKey, events, nextPageKey }: EventDocWorkspaceAppendFullHistoryPayload,
): EventDocWorkspaceState => {
  const current = state.fullHistory[slotKey];

  if (!(slotKey in state.slots) || !current) {
    return state;
  }

  return {
    ...state,
    fullHistory: { ...state.fullHistory, [slotKey]: { events: [...current.events, ...events], nextPageKey } },
  };
};
