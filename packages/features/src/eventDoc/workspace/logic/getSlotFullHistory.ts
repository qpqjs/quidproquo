import { Nullable } from 'quidproquo-core';

import { EventDocWorkspaceHistoryPage } from '../types/EventDocWorkspaceHistoryPage';
import { EventDocWorkspaceState } from '../types/EventDocWorkspaceState';

/** One slot's newest-first display history, or null when nothing has been loaded. A set nextPageKey means older events remain. */
export const getSlotFullHistory = (state: EventDocWorkspaceState, slotKey: string): Nullable<EventDocWorkspaceHistoryPage> =>
  state.fullHistory[slotKey] ?? null;
