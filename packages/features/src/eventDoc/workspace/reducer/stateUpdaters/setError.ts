import { EventDocWorkspaceSetErrorPayload } from '../../effects/EventDocWorkspaceSetErrorEffect';
import { EventDocWorkspaceState } from '../../types/EventDocWorkspaceState';
import { updateSlotState } from './updateSlotState';

/** Sets a slot's error. */
export const setError = (state: EventDocWorkspaceState, { slotKey, error }: EventDocWorkspaceSetErrorPayload): EventDocWorkspaceState =>
  updateSlotState(state, slotKey, { error });
