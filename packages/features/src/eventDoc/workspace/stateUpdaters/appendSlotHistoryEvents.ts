import { EventDocEvent } from '../../models';
import { isContiguousWithSlotHead } from '../logic/isContiguousWithSlotHead';
import { EventDocWorkspaceSlotFoldsConfig } from '../types/EventDocWorkspaceSlotFoldsConfig';
import { EventDocWorkspaceState } from '../types/EventDocWorkspaceState';
import { foldHistoryEventsIntoAccumulator } from './foldHistoryEventsIntoAccumulator';

/**
 * Appends events to a slot's history and folds them into the stored accumulator in one step, so the two cannot disagree.
 * Refuses a batch that does not follow on from the slot's head: folding past a gap would silently drop another writer's
 * events, so the state is returned unchanged and the stories resync instead.
 */
export const appendSlotHistoryEvents = (
  slots: EventDocWorkspaceSlotFoldsConfig,
  state: EventDocWorkspaceState,
  slotKey: string,
  events: EventDocEvent[],
): EventDocWorkspaceState => {
  const slot = slots[slotKey];

  if (!(slotKey in state.slots) || !slot || !isContiguousWithSlotHead(state, slotKey, events)) {
    return state;
  }

  return {
    ...state,
    history: { ...state.history, [slotKey]: [...(state.history[slotKey] ?? []), ...events] },
    historyViews: { ...state.historyViews, [slotKey]: foldHistoryEventsIntoAccumulator(slot, state.historyViews[slotKey], events) },
  };
};
