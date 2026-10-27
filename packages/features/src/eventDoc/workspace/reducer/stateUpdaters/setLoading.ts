import { EventDocWorkspaceSetLoadingPayload } from '../../effects/EventDocWorkspaceSetLoadingEffect';
import { EventDocWorkspaceState } from '../../types/EventDocWorkspaceState';
import { updateSlotState } from './updateSlotState';

/** Sets a slot's loading flag. */
export const setLoading = (state: EventDocWorkspaceState, { slotKey, isLoading }: EventDocWorkspaceSetLoadingPayload): EventDocWorkspaceState =>
  updateSlotState(state, slotKey, { isLoading });
