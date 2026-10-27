import { EventDocWorkspaceState } from '../types/EventDocWorkspaceState';

/** True while any slot is loading. */
export const selectEventDocWorkspaceIsLoading = (state: EventDocWorkspaceState): boolean =>
  Object.values(state.slots).some((slotState) => slotState.isLoading);
