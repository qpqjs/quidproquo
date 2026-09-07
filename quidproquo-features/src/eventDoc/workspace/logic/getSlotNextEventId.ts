import { EventDocWorkspaceState } from '../types/EventDocWorkspaceState';
import { getSlotHistory } from './getSlotHistory';
import { getSlotPending } from './getSlotPending';

// The provisional log position for a slot's next pending event: one past the newest
// thing the slot holds — its last pending event, else its last saved event, else its
// snapshot base — so pending events order after history and after each other. -1 for a
// slot holding nothing at all (a local slot's first commit lands at 0). Provisional
// because the server assigns the real id on save; nothing folds on this number.
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
