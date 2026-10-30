import { Nullable } from '@qpqjs/core';

import { EventDocEvent, EventDocSnapshotBase } from '../../models';
import { EventDocWorkspaceHistoryPage } from './EventDocWorkspaceHistoryPage';
import { EventDocWorkspaceSlotState } from './EventDocWorkspaceSlotState';

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
