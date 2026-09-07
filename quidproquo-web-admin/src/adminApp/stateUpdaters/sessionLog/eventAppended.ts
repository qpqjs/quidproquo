import { EventDocEvent } from 'quidproquo-features';

import { coalesceEventTypes } from '../../constants/coalesceEventTypes';
import { AdminSessionEventType } from '../../effects/session/AdminSessionEventType';
import { SessionLogState } from '../../SessionLogState';

// Event ids are contiguous positions in the log, so an optimistic append has to
// guess the next one: head + 1, or 0 for the first event of a fresh doc.
const nextLocalEventId = (state: SessionLogState): number => {
  const tail = state.pendingEvents[state.pendingEvents.length - 1] ?? state.events[state.events.length - 1];
  return tail ? tail.payload.metadata.eventId + 1 : 0;
};

// Optimistic append with coalescing: while the previous event of the same
// coalescable type is still pending, the new one replaces it (latest value
// wins). The head is never coalesced while the flush has it in flight — the
// POSTed clientMessageId must stay matchable for the save ack.
export const eventAppended = (state: SessionLogState, event: EventDocEvent): SessionLogState => {
  const last = state.pendingEvents[state.pendingEvents.length - 1];

  const lastIsInFlightHead = state.pendingEvents.length === 1 && state.flush.inFlight;
  const shouldCoalesce =
    !!last && !lastIsInFlightHead && last.type === event.type && coalesceEventTypes.includes(event.type as AdminSessionEventType);

  if (shouldCoalesce) {
    const coalesced: EventDocEvent = {
      ...event,
      payload: {
        ...event.payload,
        // Takes over the replaced event's position rather than claiming a new one, so
        // coalescing does not leave a hole in the contiguous log.
        metadata: { ...event.payload.metadata, eventId: last.payload.metadata.eventId },
      },
    };

    return {
      ...state,
      pendingEvents: [...state.pendingEvents.slice(0, -1), coalesced],
    };
  }

  const appended: EventDocEvent = {
    ...event,
    payload: {
      ...event.payload,
      metadata: { ...event.payload.metadata, eventId: nextLocalEventId(state) },
    },
  };

  return {
    ...state,
    pendingEvents: [...state.pendingEvents, appended],
  };
};
