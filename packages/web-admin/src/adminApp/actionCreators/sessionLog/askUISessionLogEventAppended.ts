import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';
import { EventDocEvent } from 'quidproquo-features';

import { SessionLogEffect } from '../../effects/sessionLog/SessionLogEffect';
import { SessionLogEventAppendedEffect } from '../../effects/sessionLog/SessionLogEventAppendedEffect';

export function* askUISessionLogEventAppended(event: EventDocEvent): AskResponse<void> {
  yield* askStateDispatchEffect<SessionLogEventAppendedEffect>(SessionLogEffect.eventAppended, event);
}
