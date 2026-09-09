import { EventDocWorkspaceState } from '../types/EventDocWorkspaceState';
import { getSlotHistory } from './getSlotHistory';
import { getSlotPending } from './getSlotPending';

/**
 * Provisional id for the slot's next pending event: one past its last pending event, else its last history event, else its
 * base; 0 for an empty slot. The server assigns the real id on save.
 */
export const getSlotNextEventId = (state: EventDocWorkspaceState, slotKey: string): number => {
  const pending = getSlotPending(state, slotKey);
  const history = getSlotHistory(state, slotKey);

  const newest = pending[pending.length - 1] ?? history[history.length - 1];

  if (newest) {
    return newest.payload.metadata.eventId + 1;
  }

  const base = state.bases[slotKey];

  return base ? base.eventId + 1 : 0;
};
