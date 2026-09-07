import { askDateNow, askNewGuid, AskResponse } from 'quidproquo-core';

import { askEventDocEventWrite } from '../data/askEventDocEventWrite';
import { EventDocEffect, EventDocEvent, EventDocEventActor, EventDocInitData } from '../models';

/**
 * Seed a new model's log with its INIT_STATE event, carrying the document's
 * identity (id/code/name). Create-only — clients never send INIT_STATE. It is event 0,
 * the position every later append counts from; the conditional write means a second
 * create of the same id fails loudly instead of rewriting the document's origin.
 */
export function* askEventDocSeedInitState(modelId: string, code: string, name: string, actor: EventDocEventActor): AskResponse<EventDocEvent> {
  const now = yield* askDateNow();

  const event: EventDocEvent<EventDocInitData> = {
    type: EventDocEffect.InitState,
    payload: {
      data: { id: modelId, code, name },
      metadata: {
        version: 1,
        clientMessageId: yield* askNewGuid(),
        createdBy: actor,
        createdAt: now,
        eventId: 0,
      },
    },
  };

  yield* askEventDocEventWrite(modelId, event);

  return event;
}
