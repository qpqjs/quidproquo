import { EventDocWorkspaceSlotFoldsConfig } from '../types/EventDocWorkspaceSlotFoldsConfig';
import { EventDocWorkspaceState } from '../types/EventDocWorkspaceState';
import { createInitialEventDocWorkspaceSlotState } from './createInitialEventDocWorkspaceSlotState';

const mapFromSlotKeys = <T>(slotKeys: string[], createValue: () => T): Record<string, T> =>
  Object.fromEntries(slotKeys.map((slotKey) => [slotKey, createValue()]));

/** Initial state; takes the configs because historyViews seeds each slot's initial view. */
export const createInitialEventDocWorkspaceState = (slots: EventDocWorkspaceSlotFoldsConfig): EventDocWorkspaceState => {
  const slotKeys = Object.keys(slots);

  return {
    history: mapFromSlotKeys(slotKeys, () => []),
    pending: mapFromSlotKeys(slotKeys, () => []),
    transient: mapFromSlotKeys(slotKeys, () => ({})),
    bases: mapFromSlotKeys(slotKeys, () => null),
    fullHistory: mapFromSlotKeys(slotKeys, () => null),
    historyViews: Object.fromEntries(Object.entries(slots).map(([slotKey, slot]) => [slotKey, slot.createInitialViewState()])),
    slots: mapFromSlotKeys(slotKeys, createInitialEventDocWorkspaceSlotState),
  };
};
