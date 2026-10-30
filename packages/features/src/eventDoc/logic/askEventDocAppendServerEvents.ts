import { askCatch, askDateNow, askGuidNewSortableMany, askKeyValueStoreUpsertManyBase, AskResponse, askThrowError, ErrorTypeEnum } from '@qpqjs/core';

import { EVENT_DOC_APPEND_MAX_RETRIES } from '../constants/eventDocAppendRetry';
import { askEventDocStoreRead } from '../context/askEventDocStoreRead';
import { askEventDocEventWriteMany } from '../data/askEventDocEventWriteMany';
import { EventDocEffect, EventDocEvent, EventDocEventActor, EventDocEventAppendOptions, EventDocServerEventInput } from '../models';
import { askEventDocAppendRefold } from './askEventDocAppendRefold';
import { askEventDocAppendRetrying } from './askEventDocAppendRetrying';
import { askEventDocSendHeadMoved } from './askEventDocSendHeadMoved';

/**
 * Append a burst of server-authored events as one conditional transaction claiming head + 1 .. head + n
 * (input order is log order); a Conflict re-laps on a fresh head. Runs no hooks and rejects stores that have them,
 * rejects Publish events, and skips validation unless `validate: true`. Every event shares one createdAt. A batch
 * holding a reserved lifecycle event brings the summary row up to its last event before returning.
 */
export function* askEventDocAppendServerEvents(
  modelId: string,
  inputs: EventDocServerEventInput[],
  actor: EventDocEventActor,
  options: EventDocEventAppendOptions = { validate: false },
): AskResponse<EventDocEvent[]> {
  if (inputs.length === 0) {
    return [];
  }

  // A batch bypasses hooks, so a store with hooks (or a Publish, which has its own hook) must fail loudly here.
  const { onAppend, onPublish } = yield* askEventDocStoreRead();
  if (onAppend || onPublish) {
    return yield* askThrowError(
      ErrorTypeEnum.Invalid,
      `askEventDocAppendServerEvents cannot batch onto a store with onAppend/onPublish hooks - use per-event appends`,
    );
  }
  if (inputs.some((input) => input.type === EventDocEffect.Publish)) {
    return yield* askThrowError(ErrorTypeEnum.Invalid, `askEventDocAppendServerEvents cannot batch a Publish event - use per-event appends`);
  }

  const now = yield* askDateNow();
  const clientMessageIds = yield* askGuidNewSortableMany(inputs.length);

  const events = yield* askEventDocAppendRetrying(modelId, options.validate, {
    buildEvents: (base) =>
      inputs.map((input, index) => ({
        type: input.type,
        payload: {
          data: input.data,
          metadata: {
            version: input.version,
            clientMessageId: clientMessageIds[index] ?? '',
            createdBy: actor,
            createdAt: now,
            eventId: base.headEventId + 1 + index,
          },
        },
      })),
    askWrite: askEventDocEventWriteMany,
    slotRaceErrorTypes: [askKeyValueStoreUpsertManyBase.errorType.Conflict, askKeyValueStoreUpsertManyBase.errorType.WriteContention],
    contentionText: `Could not append ${inputs.length} events to model ${modelId}: lost the slot race ${EVENT_DOC_APPEND_MAX_RETRIES} times - another writer is on this document.`,
  });

  yield* askEventDocAppendRefold(modelId, events);

  // One push for the batch, at its last event. Best-effort, as in the single append.
  const lastEvent = events[events.length - 1];
  if (lastEvent) {
    yield* askCatch(askEventDocSendHeadMoved(modelId, lastEvent));
  }

  return events;
}
