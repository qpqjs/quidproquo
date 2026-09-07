import { askNewGuid, AskResponse } from 'quidproquo-core';

import { EventDocEvent, EventDocEventActor } from '../models';
import { askEventDocEventAppend } from './askEventDocEventAppend';

/**
 * Append a server-authored event from its type, typed data and schema version. Skips the pre-write
 * validation gate (the fold is the gate for trusted server code). Requires the store context.
 */
export function* askEventDocAppendServerEvent<T>(
  modelId: string,
  type: string,
  data: T,
  version: number,
  actor: EventDocEventActor,
): AskResponse<EventDocEvent> {
  const clientMessageId = yield* askNewGuid();

  return yield* askEventDocEventAppend(modelId, { type, payload: { data, metadata: { version, clientMessageId } } }, actor, { validate: false });
}
