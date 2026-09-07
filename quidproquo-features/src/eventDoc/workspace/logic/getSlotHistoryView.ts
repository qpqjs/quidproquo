import { EventDocWorkspaceState } from '../types/EventDocWorkspaceState';

/**
 * The slot's stored fold accumulator. It sits at the last folded event's schema version, which may be below the slot's
 * latest; latest-shaped reads go through the view selector.
 */
export const getSlotHistoryView = <TView>(state: EventDocWorkspaceState, slotKey: string): TView => state.historyViews[slotKey] as TView;
