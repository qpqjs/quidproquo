import { EventDocWorkspaceSetPendingEventsPayload } from '../../effects/EventDocWorkspaceSetPendingEventsEffect';
import { EventDocWorkspaceState } from '../../types/EventDocWorkspaceState';

/** Replaces a slot's pending buffer wholesale; no-op on an unknown slot. */
export const setPendingEvents = (
  state: EventDocWorkspaceState,
  { slotKey, events }: EventDocWorkspaceSetPendingEventsPayload,
): EventDocWorkspaceState => (slotKey in state.slots ? { ...state, pending: { ...state.pending, [slotKey]: events } } : state);
