import { EventDocWorkspaceDropTransientPayload } from '../../effects/EventDocWorkspaceDropTransientEffect';
import { EventDocWorkspaceState } from '../../types/EventDocWorkspaceState';

/** Removes one transientKey from every slot. Slots not holding the key keep their record identity so selector memo keys stay stable. */
export const dropTransient = (state: EventDocWorkspaceState, { transientKey }: EventDocWorkspaceDropTransientPayload): EventDocWorkspaceState => {
  const holdingSlotKeys = Object.entries(state.transient)
    .filter(([, slotTransient]) => transientKey in slotTransient)
    .map(([slotKey]) => slotKey);

  if (holdingSlotKeys.length === 0) {
    return state;
  }

  const transient = { ...state.transient };

  for (const slotKey of holdingSlotKeys) {
    transient[slotKey] = Object.fromEntries(Object.entries(transient[slotKey] ?? {}).filter(([key]) => key !== transientKey));
  }

  return { ...state, transient };
};
