import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';
import { EventDocEvent } from '@qpqjs/features';

import { SessionLogDocCreatedEffect } from '../../effects/sessionLog/SessionLogDocCreatedEffect';
import { SessionLogEffect } from '../../effects/sessionLog/SessionLogEffect';

export function* askUISessionLogDocCreated(docId: string, events: EventDocEvent[]): AskResponse<void> {
  yield* askStateDispatchEffect<SessionLogDocCreatedEffect>(SessionLogEffect.docCreated, { docId, events });
}
