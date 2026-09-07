import { EventDocEvent } from '../../../models';
import { EventDocWorkspaceApplyEventPayload } from '../../effects/EventDocWorkspaceApplyEventEffect';
import { getSlotNextEventId } from '../../logic/getSlotNextEventId';
import { EventDocWorkspaceCoalesceRules } from '../../types/EventDocWorkspaceCoalesceRules';
import { EventDocWorkspaceState } from '../../types/EventDocWorkspaceState';
import { coalesceWorkspaceEvents } from '../coalesceWorkspaceEvents';

/**
 * Lands a commit in the slot's pending buffer. Coalescing and the provisional eventId stamp happen here, atomically, so
 * parallel commits cannot read the same next position. The server assigns the real id on save.
 */
export const createApplyEventUpdater =
  (coalesceRulesBySlot: Record<string, EventDocWorkspaceCoalesceRules>) =>
  (state: EventDocWorkspaceState, { slotKey, event }: EventDocWorkspaceApplyEventPayload): EventDocWorkspaceState => {
    if (!(slotKey in state.slots)) {
      return state;
    }

    const rules = coalesceRulesBySlot[slotKey] ?? [];
    const retained = coalesceWorkspaceEvents(state.pending[slotKey] ?? [], event, rules);
    const stamped: EventDocEvent = {
      ...event,
      payload: { ...event.payload, metadata: { ...event.payload.metadata, eventId: getSlotNextEventId(state, slotKey) } },
    };

    return {
      ...state,
      pending: {
        ...state.pending,
        [slotKey]: [...retained, stamped],
      },
    };
  };
