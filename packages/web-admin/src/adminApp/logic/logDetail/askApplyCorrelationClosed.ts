import { AskResponse, askStateRead } from 'quidproquo-core';

import { askApplySessionEvent } from '../../actions/askApplySessionEvent';
import { AdminAppState } from '../../AdminAppState';
import { AdminSessionEventType } from '../../effects/session/AdminSessionEventType';
import { CorrelationClosedData } from '../../effects/session/CorrelationClosedEvent';
import { selectOpenCorrelation } from '../selectors/selectOpenCorrelation';
import { askProjectSessionToUrl } from '../url/askProjectSessionToUrl';

export function* askApplyCorrelationClosed(): AskResponse<void> {
  const state = yield* askStateRead<AdminAppState>('');
  const openCorrelation = selectOpenCorrelation(state);

  if (!openCorrelation) {
    return;
  }

  yield* askApplySessionEvent<CorrelationClosedData>(AdminSessionEventType.correlationClosed, { correlationId: openCorrelation });

  yield* askProjectSessionToUrl();
}
