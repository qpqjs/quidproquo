import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { SessionLogEffect } from '../../effects/sessionLog/SessionLogEffect';
import { SessionLogFlushFailedEffect } from '../../effects/sessionLog/SessionLogFlushFailedEffect';

export function* askUISessionLogFlushFailed(errorText: string): AskResponse<void> {
  yield* askStateDispatchEffect<SessionLogFlushFailedEffect>(SessionLogEffect.flushFailed, { errorText });
}
