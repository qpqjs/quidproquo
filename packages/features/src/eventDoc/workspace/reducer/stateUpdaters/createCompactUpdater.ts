import { EventDocSnapshotBase } from '../../../models';
import { EventDocWorkspaceCompactPayload } from '../../effects/EventDocWorkspaceCompactEffect';
import { EventDocWorkspaceSlotFoldsConfig } from '../../types/EventDocWorkspaceSlotFoldsConfig';
import { EventDocWorkspaceSlotKind } from '../../types/EventDocWorkspaceSlotKind';
import { EventDocWorkspaceState } from '../../types/EventDocWorkspaceState';

/**
 * Makes the stored accumulator the slot's base at its last held event and empties the history. No fold and no fetch: the
 * accumulator already is the state at that event (its dedup window included). The base is filed under the slot's own
 * snapshot cache key so a captured runtime snapshot still passes init's staleness check. No-op on an unknown slot or an
 * empty history.
 */
export const createCompactUpdater =
  (slots: EventDocWorkspaceSlotFoldsConfig) =>
  (state: EventDocWorkspaceState, { slotKey }: EventDocWorkspaceCompactPayload): EventDocWorkspaceState => {
    const slot = slots[slotKey];
    const history = state.history[slotKey] ?? [];
    const lastEvent = history[history.length - 1];

    if (!(slotKey in state.slots) || !slot || !lastEvent) {
      return state;
    }

    const snapshotCacheKey =
      slot.kind === EventDocWorkspaceSlotKind.document ? (slot.getSnapshotCacheKey?.() ?? state.bases[slotKey]?.snapshotCacheKey) : undefined;

    const base: EventDocSnapshotBase = {
      eventId: lastEvent.payload.metadata.eventId,
      state: state.historyViews[slotKey],
      ...(snapshotCacheKey === undefined ? {} : { snapshotCacheKey }),
    };

    return {
      ...state,
      history: { ...state.history, [slotKey]: [] },
      bases: { ...state.bases, [slotKey]: base },
    };
  };
