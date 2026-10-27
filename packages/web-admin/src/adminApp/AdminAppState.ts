import { createInitialSessionLogState, SessionLogState } from './SessionLogState';
import { createInitialVolatileState, VolatileState } from './VolatileState';

// The whole admin runtime state: the session event log (source of truth for the
// audited session — folded, never stored) and the volatile server-data cache.
export type AdminAppState = {
  sessionLog: SessionLogState;
  volatile: VolatileState;
};

export const createInitialAdminAppState = (): AdminAppState => ({
  sessionLog: createInitialSessionLogState(),
  volatile: createInitialVolatileState(),
});
