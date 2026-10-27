import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { SessionLogEffect } from '../../effects/sessionLog/SessionLogEffect';
import { SessionLogFlushStartedEffect } from '../../effects/sessionLog/SessionLogFlushStartedEffect';

export function* askUISessionLogFlushStarted(): AskResponse<void> {
  yield* askStateDispatchEffect<SessionLogFlushStartedEffect>(SessionLogEffect.flushStarted);
}
