import { EventDocEvent } from '../../../models';
import { EventDocWorkspaceSlotFoldsConfig } from '../../types/EventDocWorkspaceSlotFoldsConfig';
import { EventDocWorkspaceState } from '../../types/EventDocWorkspaceState';
import { foldHistoryEventsIntoAccumulator } from './foldHistoryEventsIntoAccumulator';

/** Appends events to a slot's history and folds them into the stored accumulator in one step, so the two cannot disagree. */
export const appendSlotHistoryEvents = (
  slots: EventDocWorkspaceSlotFoldsConfig,
  state: EventDocWorkspaceState,
  slotKey: string,
  events: EventDocEvent[],
): EventDocWorkspaceState => {
  const slot = slots[slotKey];

  if (!(slotKey in state.slots) || !slot) {
    return state;
  }

  return {
    ...state,
    history: { ...state.history, [slotKey]: [...(state.history[slotKey] ?? []), ...events] },
    historyViews: { ...state.historyViews, [slotKey]: foldHistoryEventsIntoAccumulator(slot, state.historyViews[slotKey], events) },
  };
};
