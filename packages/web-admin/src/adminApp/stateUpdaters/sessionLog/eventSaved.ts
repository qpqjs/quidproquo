import { EventDocEvent } from 'quidproquo-features';

import { SessionLogEventSavedPayload } from '../../effects/sessionLog/SessionLogEventSavedEffect';
import { SessionLogState } from '../../SessionLogState';

// Server ack: the pending event moves to the acked log with its server-stamped
// metadata, and the remaining pending events renumber onto consecutive event ids
// after it (the server may have assigned a later position than our optimistic one).
export const eventSaved = (state: SessionLogState, payload: SessionLogEventSavedPayload): SessionLogState => {
  const savedAt = state.pendingEvents.findIndex((event) => event.payload.metadata.clientMessageId === payload.clientMessageId);

  const remaining = savedAt === -1 ? state.pendingEvents : [...state.pendingEvents.slice(0, savedAt), ...state.pendingEvents.slice(savedAt + 1)];

  const renumbered = remaining.map((event, offset): EventDocEvent => ({
    ...event,
    payload: {
      ...event.payload,
      metadata: { ...event.payload.metadata, eventId: payload.storedEvent.payload.metadata.eventId + 1 + offset },
    },
  }));

  return {
    ...state,
    events: [...state.events, payload.storedEvent],
    pendingEvents: renumbered,
    flush: { inFlight: false, lastError: null, retryCount: 0 },
  };
};
