import { EventDocWorkspaceSelector } from '../types/EventDocWorkspaceSelectors';

/** Dirty means unsaved pending events in a document slot; a local slot's pending is session state and never counts. */
export const createEventDocWorkspaceIsDirtySelector =
  (documentSlotKeys: string[]): EventDocWorkspaceSelector<boolean> =>
  (state) =>
    documentSlotKeys.some((slotKey) => (state.pending[slotKey] ?? []).length > 0);
