import { AskResponse } from '@qpqjs/core';

import { askApplySessionEvent } from '../../actions/askApplySessionEvent';
import { AdminSessionCorrelationOpenedData } from '../../effects/session/AdminSessionCorrelationOpenedEffect';
import { AdminSessionEffect } from '../../effects/session/AdminSessionEffect';
import { CorrelationOpenSource } from '../../types/CorrelationOpenSource';
import { askProjectSessionToUrl } from '../url/askProjectSessionToUrl';

export function* askApplyCorrelationOpened(correlationId: string, source: CorrelationOpenSource): AskResponse<void> {
  yield* askApplySessionEvent<AdminSessionCorrelationOpenedData>(AdminSessionEffect.CorrelationOpened, { correlationId, source });

  yield* askProjectSessionToUrl();
}
