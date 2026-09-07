import { askDateNow, askNewGuid, AskResponse } from 'quidproquo-core';

import { askEventDocEventWrite } from '../data/askEventDocEventWrite';
import { EventDocEffect, EventDocEvent, EventDocEventActor, EventDocInitData } from '../models';

/**
 * Seed a new model's log with its INIT_STATE event (event 0) carrying id/code/name. Create-only; the conditional
 * write makes a second create of the same id fail loudly.
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
