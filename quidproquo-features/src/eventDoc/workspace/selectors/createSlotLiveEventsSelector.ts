import { EventDocEvent } from '../../models';
import { noEvents } from '../constants/noEvents';
import { getSlotHistory } from '../logic/getSlotHistory';
import { getSlotPending } from '../logic/getSlotPending';
import { EventDocWorkspaceSelector } from '../types/EventDocWorkspaceSelectors';

/** [...history, ...pending] for one slot (everything since the fold base), memoized on stream identity. */
export const createSlotLiveEventsSelector = (slotKey: string): EventDocWorkspaceSelector<EventDocEvent[]> => {
  let cachedHistory: EventDocEvent[] | undefined;
  let cachedPending: EventDocEvent[] | undefined;
  let cachedLive: EventDocEvent[] = noEvents;

  return (state) => {
    const history = getSlotHistory(state, slotKey);
    const pending = getSlotPending(state, slotKey);

    if (history !== cachedHistory || pending !== cachedPending) {
      cachedHistory = history;
      cachedPending = pending;
      cachedLive = [...history, ...pending];
    }

    return cachedLive;
  };
};
