import {
  askDateNow,
  askKeyValueStoreUpsertManyBase,
  askNewSortableGuids,
  AskResponse,
  askRetry,
  askThrowError,
  ErrorTypeEnum,
} from 'quidproquo-core';

import {
  EVENT_DOC_APPEND_MAX_RETRIES,
  EVENT_DOC_APPEND_RETRY_BASE_WAIT_MS,
  EVENT_DOC_APPEND_RETRY_MAX_JITTER_MS,
} from '../constants/eventDocAppendRetry';
import { askEventDocStoreRead } from '../context/askEventDocStoreRead';
import { askEventDocEventWriteMany } from '../data/askEventDocEventWriteMany';
import { EventDocAppendBase, EventDocEffect, EventDocEvent, EventDocEventActor, EventDocServerEventInput } from '../models';
import { askEventDocAppendBaseAdvance } from './askEventDocAppendBaseAdvance';
import { askEventDocAppendBaseResolve } from './askEventDocAppendBaseResolve';
import { EventDocEventAppendOptions } from './askEventDocEventAppend';
import { askEventDocValidateAppendRun } from './askEventDocValidateAppendRun';

/**
 * Append a burst of server-authored events as one conditional transaction claiming head + 1 .. head + n
 * (input order is log order); a Conflict re-laps on a fresh head. Runs no hooks and rejects stores that have them,
 * rejects Publish events, and skips validation unless `validate: true`. Every event shares one createdAt.
 */
const isSlotRaceError = (errorType: string): boolean =>
  errorType === askKeyValueStoreUpsertManyBase.errorType.Conflict || errorType === askKeyValueStoreUpsertManyBase.errorType.WriteContention;

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
  const clientMessageIds = yield* askNewSortableGuids(inputs.length);

  let base: EventDocAppendBase = yield* askEventDocAppendBaseResolve(modelId, options.validate);
  let lostLaps = 0;

  function* askAppendLap(): AskResponse<EventDocEvent[]> {
    if (lostLaps > 0) {
      base = yield* askEventDocAppendBaseAdvance(modelId, base);
    }
    lostLaps += 1;

    const events: EventDocEvent[] = inputs.map((input, index) => ({
      type: input.type,
      payload: {
        data: input.data,
        metadata: {
          version: input.version,
          clientMessageId: clientMessageIds[index],
          createdBy: actor,
          createdAt: now,
          eventId: base.headEventId + 1 + index,
        },
      },
    }));

    if (base.state) {
      yield* askEventDocValidateAppendRun(events, base.state.state);
    }

    yield* askEventDocEventWriteMany(modelId, events);

    return events;
  }

  const result = yield* askRetry(
    askAppendLap,
    EVENT_DOC_APPEND_MAX_RETRIES,
    EVENT_DOC_APPEND_RETRY_BASE_WAIT_MS,
    [askKeyValueStoreUpsertManyBase.errorType.Conflict, askKeyValueStoreUpsertManyBase.errorType.WriteContention],
    { linearBackoff: true, maxJitterMs: EVENT_DOC_APPEND_RETRY_MAX_JITTER_MS },
  );

  if (!result.success) {
    if (isSlotRaceError(result.error.errorType)) {
      return yield* askThrowError(
        ErrorTypeEnum.Conflict,
        `Could not append ${inputs.length} events to model ${modelId}: lost the slot race ${EVENT_DOC_APPEND_MAX_RETRIES} times - another writer is on this document.`,
      );
    }

    return yield* askThrowError(result.error.errorType, result.error.errorText, result.error.errorStack);
  }

  return result.result;
}
