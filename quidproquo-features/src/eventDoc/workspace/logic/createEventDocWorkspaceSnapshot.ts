import { EventDocWorkspaceSnapshot } from '../types/EventDocWorkspaceSnapshot';
import { EventDocWorkspaceState } from '../types/EventDocWorkspaceState';

/**
 * Captures what carries across runtimes: identity, pending, history and base per initialised document slot, and the pending
 * stream per non-empty local slot.
 */
export const createEventDocWorkspaceSnapshot = (
  state: EventDocWorkspaceState,
  documentSlotKeys: string[],
  localSlotKeys: string[],
): EventDocWorkspaceSnapshot => ({
  slots: Object.fromEntries(
    documentSlotKeys.flatMap((slotKey) => {
      const documentIdentity = state.slots[slotKey]?.documentIdentity;

      if (!documentIdentity) {
        return [];
      }

      return [
        [
          slotKey,
          {
            documentIdentity,
            pending: state.pending[slotKey] ?? [],
            history: state.history[slotKey] ?? [],
            // A bootstrap-loaded history is partial and refolds wrongly without its base.
            base: state.bases[slotKey] ?? null,
          },
        ],
      ];
    }),
  ),
  localSlots: Object.fromEntries(
    localSlotKeys.flatMap((slotKey) => {
      const pending = state.pending[slotKey] ?? [];

      return pending.length > 0 ? [[slotKey, pending]] : [];
    }),
  ),
});
