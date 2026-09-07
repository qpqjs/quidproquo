import {
  askDateNow,
  askInlineFunctionExecute,
  askKeyValueStoreUpsertBase,
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
import { askEventDocEventWrite } from '../data/askEventDocEventWrite';
import {
  EventDocAppendBase,
  EventDocEffect,
  EventDocEvent,
  EventDocEventActor,
  EventDocEventInput,
  EventDocOnAppendInput,
  EventDocOnPublishInput,
} from '../models';
import { askEventDocAppendBaseAdvance } from './askEventDocAppendBaseAdvance';
import { askEventDocAppendBaseResolve } from './askEventDocAppendBaseResolve';
import { askEventDocGetByIdOrThrow } from './askEventDocGetByIdOrThrow';
import { askEventDocHookStates } from './askEventDocHookStates';
import { askEventDocValidateAppend } from './askEventDocValidateAppend';

/** Options shared by the single and batch appends (their defaults differ). */
export type EventDocEventAppendOptions = {
  // Run the registered validator against the state at head before the write. True at the client boundary
  // (the append route); server writers may skip it, but should set it when other writers can touch the document.
  validate: boolean;
};

/**
 * Append an event at head + 1 with a conditional write; a Conflict re-laps by advancing the held state past
 * the winners and validating again, up to EVENT_DOC_APPEND_MAX_RETRIES. Hooks run after the write, outside the retry.
 * The summary read model is maintained by the stream projector, not here.
 */
export function* askEventDocEventAppend(
  modelId: string,
  input: EventDocEventInput,
  actor: EventDocEventActor,
  options: EventDocEventAppendOptions = { validate: true },
): AskResponse<EventDocEvent> {
  const { metadata } = input.payload;

  const now = yield* askDateNow();

  let base: EventDocAppendBase = yield* askEventDocAppendBaseResolve(modelId, options.validate);
  let lostLaps = 0;

  function* askAppendLap(): AskResponse<EventDocEvent> {
    if (lostLaps > 0) {
      base = yield* askEventDocAppendBaseAdvance(modelId, base);
    }
    lostLaps += 1;

    const event: EventDocEvent = {
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
    };

    if (base.state) {
      yield* askEventDocValidateAppend(event, base.state.state);
    }

    yield* askEventDocEventWrite(modelId, event);

    return event;
  }

  const result = yield* askRetry(
    askAppendLap,
    EVENT_DOC_APPEND_MAX_RETRIES,
    EVENT_DOC_APPEND_RETRY_BASE_WAIT_MS,
    // Only the slot race re-laps; Invalid and everything else is terminal.
    [askKeyValueStoreUpsertBase.errorType.Conflict],
    { linearBackoff: true, maxJitterMs: EVENT_DOC_APPEND_RETRY_MAX_JITTER_MS },
  );

  if (!result.success) {
    if (result.error.errorType === askKeyValueStoreUpsertBase.errorType.Conflict) {
      return yield* askThrowError(
        ErrorTypeEnum.Conflict,
        `Could not append to model ${modelId}: lost the slot race ${EVENT_DOC_APPEND_MAX_RETRIES} times - too much concurrent write contention.`,
      );
    }

    return yield* askThrowError(result.error.errorType, result.error.errorText, result.error.errorStack);
  }

  const event = result.result;

  // Hooks run outside the retry: a hook that throws Conflict must not re-run the append.
  const { onPublish, onAppend } = yield* askEventDocStoreRead();
  const firePublishHook = !!onPublish && event.type === EventDocEffect.Publish;

  if (firePublishHook || onAppend) {
    const summary = yield* askEventDocGetByIdOrThrow(modelId);
    const { state, previousState } = yield* askEventDocHookStates(modelId, event);

    if (firePublishHook) {
      yield* askInlineFunctionExecute<void, EventDocOnPublishInput>(onPublish!, {
        docId: modelId,
        event,
        summary,
        state,
        previousState,
      });
    }

    // onAppend runs after onPublish so it observes whatever read model onPublish just synced.
    if (onAppend) {
      yield* askInlineFunctionExecute<void, EventDocOnAppendInput>(onAppend, {
        docId: modelId,
        event,
        summary,
        state,
        previousState,
      });
    }
  }

  return event;
}
