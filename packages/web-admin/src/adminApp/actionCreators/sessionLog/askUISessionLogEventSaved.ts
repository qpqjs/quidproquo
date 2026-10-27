import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';
import { EventDocEvent } from 'quidproquo-features';

import { SessionLogEffect } from '../../effects/sessionLog/SessionLogEffect';
import { SessionLogEventSavedEffect } from '../../effects/sessionLog/SessionLogEventSavedEffect';

export function* askUISessionLogEventSaved(clientMessageId: string, storedEvent: EventDocEvent): AskResponse<void> {
  yield* askStateDispatchEffect<SessionLogEventSavedEffect>(SessionLogEffect.eventSaved, { clientMessageId, storedEvent });
}
