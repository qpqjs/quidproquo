import { EventDocWorkspaceSlotState } from '../../types/EventDocWorkspaceSlotState';
import { EventDocWorkspaceState } from '../../types/EventDocWorkspaceState';

/** Merges a partial update into one slot's status; no-op on an unknown slot. */
export const updateSlotState = (
  state: EventDocWorkspaceState,
  slotKey: string,
  update: Partial<EventDocWorkspaceSlotState>,
): EventDocWorkspaceState =>
  slotKey in state.slots ? { ...state, slots: { ...state.slots, [slotKey]: { ...state.slots[slotKey], ...update } } } : state;
