import { EventDocWorkspaceSelector } from '../types/EventDocWorkspaceSelectors';

/** True while any document slot is saving. */
export const createEventDocWorkspaceIsSavingSelector =
  (documentSlotKeys: string[]): EventDocWorkspaceSelector<boolean> =>
  (state) =>
    documentSlotKeys.some((slotKey) => state.slots[slotKey]?.isSaving ?? false);
