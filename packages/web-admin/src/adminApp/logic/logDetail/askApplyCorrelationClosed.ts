import { AskResponse, askStateRead } from '@qpqjs/core';

import { askApplySessionEvent } from '../../actions/askApplySessionEvent';
import { AdminSessionCorrelationClosedData } from '../../effects/session/AdminSessionCorrelationClosedEffect';
import { AdminSessionEffect } from '../../effects/session/AdminSessionEffect';
import { AdminAppState } from '../../types/AdminAppState';
import { selectOpenCorrelation } from '../selectors/selectOpenCorrelation';
import { askProjectSessionToUrl } from '../url/askProjectSessionToUrl';

export function* askApplyCorrelationClosed(): AskResponse<void> {
  const state = yield* askStateRead<AdminAppState>('');
  const openCorrelation = selectOpenCorrelation(state);

  if (!openCorrelation) {
    return;
  }

  yield* askApplySessionEvent<AdminSessionCorrelationClosedData>(AdminSessionEffect.CorrelationClosed, { correlationId: openCorrelation });

  yield* askProjectSessionToUrl();
}
