import { EventDocWorkspaceState } from '../types/EventDocWorkspaceState';
import { getSlotHeadEventId } from './getSlotHeadEventId';
import { getSlotPending } from './getSlotPending';

/**
 * Provisional id for the slot's next pending event: one past its last pending event, else one past its head; 0 for an
 * empty slot. The server assigns the real id on save.
 */
export const getSlotNextEventId = (state: EventDocWorkspaceState, slotKey: string): number => {
  const pending = getSlotPending(state, slotKey);
  const lastPending = pending[pending.length - 1];

  if (lastPending) {
    return lastPending.payload.metadata.eventId + 1;
  }

  return (getSlotHeadEventId(state, slotKey) ?? -1) + 1;
};
