import { EventDocEvent } from 'quidproquo-features';

import { AdminAppState } from '../../AdminAppState';
import { foldAdminSessionLog } from '../../adminSessionFoldReducer';
import { AdminSessionState } from '../../AdminSessionState';

// The session state IS the fold of the log (acked + pending). Memoized on log
// identity — the arrays are replaced immutably, so reference equality is exact.
let memoEvents: EventDocEvent[] | null = null;
let memoPendingEvents: EventDocEvent[] | null = null;
let memoSessionState: AdminSessionState | null = null;

export const selectSessionState = (state: AdminAppState): AdminSessionState => {
  const { events, pendingEvents } = state.sessionLog;

  if (!memoSessionState || events !== memoEvents || pendingEvents !== memoPendingEvents) {
    memoEvents = events;
    memoPendingEvents = pendingEvents;
    memoSessionState = foldAdminSessionLog([...events, ...pendingEvents]);
  }

  return memoSessionState;
};
