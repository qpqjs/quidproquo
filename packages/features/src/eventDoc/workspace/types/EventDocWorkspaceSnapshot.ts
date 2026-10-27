import { Nullable } from 'quidproquo-core';

import { EventDocEvent, EventDocSnapshotBase } from '../../models';
import { EventDocWorkspaceDocumentIdentity } from './EventDocWorkspaceDocumentIdentity';

/** One document slot's capture: identity, pending, and the held history with its base. */
export type EventDocWorkspaceSlotSnapshot = {
  documentIdentity: EventDocWorkspaceDocumentIdentity;
  pending: EventDocEvent[];
  // Absent (older bundle, or stripped by the caller) forces a blocking full fetch on restore.
  history?: EventDocEvent[];
  // Must travel with `history`, which starts after it. Absent or null means the history is the whole log.
  base?: Nullable<EventDocSnapshotBase>;
};

/** Serializable capture restorable into another runtime of the same workspace. historyViews and transients are not captured. */
export type EventDocWorkspaceSnapshot = {
  slots: Record<string, EventDocWorkspaceSlotSnapshot>;
  // Optional so an older bundle's snapshot restores cleanly.
  localSlots?: Record<string, EventDocEvent[]>;
};
