import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';
import { EventDocEvent } from '@qpqjs/features';

import { SessionLogEffect } from '../../effects/sessionLog/SessionLogEffect';
import { SessionLogEventAppendedEffect } from '../../effects/sessionLog/SessionLogEventAppendedEffect';

export function* askSessionLogEventAppended(event: EventDocEvent): AskResponse<void> {
  yield* askStateDispatchEffect<SessionLogEventAppendedEffect>(SessionLogEffect.eventAppended, event);
}
