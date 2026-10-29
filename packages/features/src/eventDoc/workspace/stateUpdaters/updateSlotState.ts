import { EventDocWorkspaceSlotState } from '../types/EventDocWorkspaceSlotState';
import { EventDocWorkspaceState } from '../types/EventDocWorkspaceState';

/** Merges a partial update into one slot's status; no-op on an unknown slot. */
export const updateSlotState = (
  state: EventDocWorkspaceState,
  slotKey: string,
  update: Partial<EventDocWorkspaceSlotState>,
): EventDocWorkspaceState => {
  const slot = state.slots[slotKey];
  return slot ? { ...state, slots: { ...state.slots, [slotKey]: { ...slot, ...update } } } : state;
};
