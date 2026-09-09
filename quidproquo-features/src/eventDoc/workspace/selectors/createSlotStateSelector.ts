import { EventDocWorkspaceSelector } from '../types/EventDocWorkspaceSelectors';
import { createInitialEventDocWorkspaceSlotState, EventDocWorkspaceSlotState } from '../types/EventDocWorkspaceSlotState';

// Shared read-only fallback for reads before init.
const fallbackSlotState = createInitialEventDocWorkspaceSlotState();

/** One slot's status, falling back to the initial state for unknown keys. */
export const createSlotStateSelector =
  (slotKey: string): EventDocWorkspaceSelector<EventDocWorkspaceSlotState> =>
  (state) =>
    state.slots[slotKey] ?? fallbackSlotState;
