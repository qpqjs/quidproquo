import { EventDocEvent } from 'quidproquo-features';

// The session event log — the SOURCE OF TRUTH for session state. `events` are
// server-acked (immutable, server-stamped metadata); `pendingEvents` is the
// optimistic dirty buffer the flush loop drains serially to the backend.
export type SessionLogState = {
  docId: string | null;
  events: EventDocEvent[];
  pendingEvents: EventDocEvent[];
  flush: {
    inFlight: boolean;
    lastError: string | null;
    retryCount: number;
  };
};

export const createInitialSessionLogState = (): SessionLogState => ({
  docId: null,
  events: [],
  pendingEvents: [],
  flush: {
    inFlight: false,
    lastError: null,
    retryCount: 0,
  },
});
