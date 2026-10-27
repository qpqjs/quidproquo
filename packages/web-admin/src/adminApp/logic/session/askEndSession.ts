import { askDelay, AskResponse, askStateRead } from 'quidproquo-core';

import { askApplySessionEvent } from '../../actions/askApplySessionEvent';
import { AdminAppState } from '../../AdminAppState';
import { sessionDrainTiming } from '../../constants/sessionDrainTiming';
import { AdminSessionEventType } from '../../effects/session/AdminSessionEventType';
import { SessionEndedData } from '../../effects/session/SessionEndedEvent';
import { SessionEndReason } from '../../types/SessionEndReason';
import { selectSessionState } from '../selectors/selectSessionState';

// Ends the session on logout: record sessionEnded, then best-effort wait for
// the flush loop to drain the pending buffer before the tokens are cleared.
export function* askEndSession(): AskResponse<void> {
  const state = yield* askStateRead<AdminAppState>('');

  if (!state.sessionLog.docId || selectSessionState(state).endedAt) {
    return;
  }

  yield* askApplySessionEvent<SessionEndedData>(AdminSessionEventType.sessionEnded, { reason: SessionEndReason.logout });

  for (let poll = 0; poll < sessionDrainTiming.maxPolls; poll++) {
    const { sessionLog } = yield* askStateRead<AdminAppState>('');

    if (sessionLog.pendingEvents.length === 0) {
      return;
    }

    yield* askDelay(sessionDrainTiming.pollMs);
  }
}
