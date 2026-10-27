import { AskResponse } from 'quidproquo-core';

import { askApplySessionEvent } from '../../actions/askApplySessionEvent';
import { AdminSessionEventType } from '../../effects/session/AdminSessionEventType';
import { CorrelationOpenedData } from '../../effects/session/CorrelationOpenedEvent';
import { CorrelationOpenSource } from '../../types/CorrelationOpenSource';
import { askProjectSessionToUrl } from '../url/askProjectSessionToUrl';

export function* askApplyCorrelationOpened(correlationId: string, source: CorrelationOpenSource): AskResponse<void> {
  yield* askApplySessionEvent<CorrelationOpenedData>(AdminSessionEventType.correlationOpened, { correlationId, source });

  yield* askProjectSessionToUrl();
}
