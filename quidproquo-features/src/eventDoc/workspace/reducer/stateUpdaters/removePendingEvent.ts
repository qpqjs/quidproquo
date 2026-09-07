import { EventDocWorkspaceRemovePendingEventPayload } from '../../effects/EventDocWorkspaceRemovePendingEventEffect';
import { EventDocWorkspaceState } from '../../types/EventDocWorkspaceState';

/**
 * Removes the pending event whose save was acked, by clientMessageId. The rest of the buffer is not renumbered: provisional
 * ids only need to order pending after history.
 */
export const removePendingEvent = (
  state: EventDocWorkspaceState,
  { slotKey, clientMessageId }: EventDocWorkspaceRemovePendingEventPayload,
): EventDocWorkspaceState =>
  slotKey in state.slots
    ? {
        ...state,
        pending: {
          ...state.pending,
          [slotKey]: (state.pending[slotKey] ?? []).filter((event) => event.payload.metadata.clientMessageId !== clientMessageId),
        },
      }
    : state;
