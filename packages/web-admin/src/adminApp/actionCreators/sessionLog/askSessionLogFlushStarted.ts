import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { SessionLogEffect } from '../../effects/sessionLog/SessionLogEffect';
import { SessionLogFlushStartedEffect } from '../../effects/sessionLog/SessionLogFlushStartedEffect';

export function* askSessionLogFlushStarted(): AskResponse<void> {
  yield* askStateDispatchEffect<SessionLogFlushStartedEffect>(SessionLogEffect.flushStarted);
}
