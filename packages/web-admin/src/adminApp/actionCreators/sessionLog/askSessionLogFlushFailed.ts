import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { SessionLogEffect } from '../../effects/sessionLog/SessionLogEffect';
import { SessionLogFlushFailedEffect } from '../../effects/sessionLog/SessionLogFlushFailedEffect';

export function* askSessionLogFlushFailed(errorText: string): AskResponse<void> {
  yield* askStateDispatchEffect<SessionLogFlushFailedEffect>(SessionLogEffect.flushFailed, { errorText });
}
