import { EventDocWorkspaceApplyTransientEventPayload } from '../../effects/EventDocWorkspaceApplyTransientEventEffect';
import { EventDocWorkspaceCoalesceRules } from '../../types/EventDocWorkspaceCoalesceRules';
import { EventDocWorkspaceState } from '../../types/EventDocWorkspaceState';
import { coalesceWorkspaceEvents } from '../coalesceWorkspaceEvents';

/**
 * Lands a transient commit under its transientKey, coalesced within that key only. eventId stays 0: transients are ordered
 * by createdAt at read.
 */
export const createApplyTransientEventUpdater =
  (coalesceRulesBySlot: Record<string, EventDocWorkspaceCoalesceRules>) =>
  (state: EventDocWorkspaceState, { slotKey, transientKey, event }: EventDocWorkspaceApplyTransientEventPayload): EventDocWorkspaceState => {
    if (!(slotKey in state.slots)) {
      return state;
    }

    const rules = coalesceRulesBySlot[slotKey] ?? [];
    const slotTransient = state.transient[slotKey] ?? {};
    const retained = coalesceWorkspaceEvents(slotTransient[transientKey] ?? [], event, rules);

    return {
      ...state,
      transient: {
        ...state.transient,
        [slotKey]: {
          ...slotTransient,
          [transientKey]: [...retained, event],
        },
      },
    };
  };
