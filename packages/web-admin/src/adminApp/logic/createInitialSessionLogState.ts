import { SessionLogState } from '../types/SessionLogState';

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
