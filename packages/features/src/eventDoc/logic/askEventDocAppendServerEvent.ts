import { askGuidNew, AskResponse } from '@qpqjs/core';

import { EventDocEvent, EventDocEventActor, EventDocEventOrigin } from '../models';
import { askEventDocEventAppend } from './askEventDocEventAppend';

/** Options for askEventDocAppendServerEvent. */
export type EventDocServerEventAppendOptions = {
  // Run the collection's domain rules against the state at head and throw Invalid on a rejection. Off by default:
  // without it a server event a rule rejects is still written, and every fold then skips it silently.
  validate?: boolean;
};

/**
 * Append a server-authored event from its type, typed data and schema version. May append the collection's
 * server-only types. Skips the pre-write validation gate unless `validate` is set (the fold is the gate for trusted
 * server code, but it drops a rejected event without telling anyone). Requires the store context.
 */
export function* askEventDocAppendServerEvent<T>(
  modelId: string,
  type: string,
  data: T,
  version: number,
  actor: EventDocEventActor,
  options: EventDocServerEventAppendOptions = {},
): AskResponse<EventDocEvent> {
  const clientMessageId = yield* askGuidNew();

  return yield* askEventDocEventAppend(modelId, { type, payload: { data, metadata: { version, clientMessageId } } }, actor, {
    validate: options.validate ?? false,
    origin: EventDocEventOrigin.server,
  });
}
