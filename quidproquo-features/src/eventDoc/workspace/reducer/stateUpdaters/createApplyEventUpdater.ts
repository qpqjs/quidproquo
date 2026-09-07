import { EventDocEvent } from '../../../models';
import { EventDocWorkspaceApplyEventPayload } from '../../effects/EventDocWorkspaceApplyEventEffect';
import { getSlotNextEventId } from '../../logic/getSlotNextEventId';
import { EventDocWorkspaceCoalesceRules } from '../../types/EventDocWorkspaceCoalesceRules';
import { EventDocWorkspaceState } from '../../types/EventDocWorkspaceState';
import { coalesceWorkspaceEvents } from '../coalesceWorkspaceEvents';

// Every commit lands in the slot's PENDING buffer (history is server truth only).
// Coalescing lives IN the reducer (not the commit story) so a commit is atomic:
// parallel commits each fold onto the latest state instead of racing a
// read-modify-write of the whole buffer. The provisional eventId is stamped HERE for
// the same reason: two commits in one parallel batch would otherwise read the same
// "next" position. It only has to order the event after what the slot already holds
// (getSlotNextEventId); the server assigns the real id on save. Closured over the
// per-slot rules so the effect payload stays lean and serializable; the local-slot
// 'all' default applies here too, so session streams hold one pending event per type.
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
