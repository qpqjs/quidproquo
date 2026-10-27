import { Nullable } from '@qpqjs/core';

import { EventDocEvent, EventDocSnapshotBase } from '../../models';
import { EventDocWorkspaceHistoryPage } from './EventDocWorkspaceHistoryPage';
import { EventDocWorkspaceSlotFoldsConfig } from './EventDocWorkspaceSlotFoldsConfig';
import { createInitialEventDocWorkspaceSlotState, EventDocWorkspaceSlotState } from './EventDocWorkspaceSlotState';

/**
 * Per-slot event streams. `history` is the saved log after `bases[slot]` (null base means the whole log); the stories
 * compact after every server-sourced append, moving the base up to the last held event, so at rest it is empty and never
 * grows with the session. `pending` is the unsaved buffer every commit lands in; `transient` holds never-saved observations
 * by transientKey. `historyViews` is the reducer-maintained fold of base + history, at the last folded event's schema
 * version. `fullHistory` is display-only.
 */
export type EventDocWorkspaceState = {
  history: Record<string, EventDocEvent[]>;
  pending: Record<string, EventDocEvent[]>;
  transient: Record<string, Record<string, EventDocEvent[]>>;
  bases: Record<string, Nullable<EventDocSnapshotBase>>;
  fullHistory: Record<string, Nullable<EventDocWorkspaceHistoryPage>>;
  historyViews: Record<string, unknown>;
  slots: Record<string, EventDocWorkspaceSlotState>;
};

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
