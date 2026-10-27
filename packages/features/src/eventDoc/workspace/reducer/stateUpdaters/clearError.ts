import { EventDocWorkspaceClearErrorPayload } from '../../effects/EventDocWorkspaceClearErrorEffect';
import { EventDocWorkspaceState } from '../../types/EventDocWorkspaceState';
import { updateSlotState } from './updateSlotState';

/** Clears a slot's error. */
export const clearError = (state: EventDocWorkspaceState, { slotKey }: EventDocWorkspaceClearErrorPayload): EventDocWorkspaceState =>
  updateSlotState(state, slotKey, { error: null });
