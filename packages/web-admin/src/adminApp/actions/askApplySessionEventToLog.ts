import { askDateNow, askNewGuid, AskResponse } from 'quidproquo-core';
import { EventDocEvent } from 'quidproquo-features';

import { askUISessionLogEventAppended } from '../actionCreators/sessionLog/askUISessionLogEventAppended';
import { adminSessionSchemaVersion } from '../constants/adminSessionSchemaVersion';
import { localSessionEventActor } from '../constants/localSessionEventActor';
import { ApplySessionEventActionPayload } from './askApplySessionEvent';

// The seam between pure yield and the event log: stamps local metadata and
// appends optimistically (index assignment + coalescing live in the reducer);
// the flush loop drains it to the backend. NOTE: the runtime invokes action
// processors with the action's PAYLOAD, so that is what this story receives.
export function* askApplySessionEventToLog(payload: ApplySessionEventActionPayload): AskResponse<void> {
  const clientMessageId = yield* askNewGuid();
  const createdAt = yield* askDateNow();

  const event: EventDocEvent = {
    type: payload.type,
    payload: {
      data: payload.data,
      metadata: {
        version: adminSessionSchemaVersion,
        clientMessageId,
        createdBy: localSessionEventActor,
        createdAt,
        eventId: 0,
      },
    },
  };

  yield* askUISessionLogEventAppended(event);
}
