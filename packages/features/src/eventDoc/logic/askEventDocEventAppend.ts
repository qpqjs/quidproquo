import { askCatch, askDateNow, askKeyValueStoreUpsertBase, AskResponse } from '@qpqjs/core';

import { EVENT_DOC_APPEND_MAX_RETRIES } from '../constants/eventDocAppendRetry';
import { askEventDocEventWrite } from '../data/askEventDocEventWrite';
import { EventDocEvent, EventDocEventActor, EventDocEventAppendOptions, EventDocEventInput, EventDocEventOrigin } from '../models';
import { askEventDocAppendHooksRun } from './askEventDocAppendHooksRun';
import { askEventDocAppendRefold } from './askEventDocAppendRefold';
import { askEventDocAppendRetrying } from './askEventDocAppendRetrying';
import { askEventDocAssertClientEventType } from './askEventDocAssertClientEventType';
import { askEventDocSendHeadMoved } from './askEventDocSendHeadMoved';

/**
 * Append an event at head + 1 with a conditional write; a Conflict re-laps by advancing the held state past
 * the winners and validating again, up to EVENT_DOC_APPEND_MAX_RETRIES. Hooks run after the write, outside the retry.
 * A reserved lifecycle event brings the summary row up to date before this returns, so a reader that follows the
 * append sees it; a domain event leaves the row to the stream projector.
 */
export function* askEventDocEventAppend(
  modelId: string,
  input: EventDocEventInput,
  actor: EventDocEventActor,
  options: EventDocEventAppendOptions = { validate: true },
): AskResponse<EventDocEvent> {
  const { metadata } = input.payload;

  if ((options.origin ?? EventDocEventOrigin.client) === EventDocEventOrigin.client) {
    yield* askEventDocAssertClientEventType(input.type);
  }

  const now = yield* askDateNow();

  const [event] = yield* askEventDocAppendRetrying<[EventDocEvent]>(modelId, options.validate, {
    buildEvents: (base) => [
      {
        type: input.type,
        payload: {
          data: input.payload.data,
          metadata: {
            version: metadata.version,
            clientMessageId: metadata.clientMessageId,
            createdBy: actor,
            createdAt: now,
            eventId: base.headEventId + 1,
          },
        },
      },
    ],
    askWrite: function* askWriteOne(id, [single]) {
      yield* askEventDocEventWrite(id, single);
    },
    slotRaceErrorTypes: [askKeyValueStoreUpsertBase.errorType.Conflict, askKeyValueStoreUpsertBase.errorType.WriteContention],
    contentionText: `Could not append to model ${modelId}: lost the slot race ${EVENT_DOC_APPEND_MAX_RETRIES} times - too much concurrent write contention.`,
  });

  const refolded = yield* askEventDocAppendRefold(modelId, [event]);

  yield* askEventDocAppendHooksRun(modelId, event, refolded);

  // Best-effort: the event has landed and a subscriber that misses the push catches up on its next refresh.
  yield* askCatch(askEventDocSendHeadMoved(modelId, event));

  return event;
}
