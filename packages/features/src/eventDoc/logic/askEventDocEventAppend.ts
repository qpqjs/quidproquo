import {
  askCatch,
  askDateNow,
  askInlineFunctionExecute,
  askKeyValueStoreUpsertBase,
  AskResponse,
  askRetry,
  askThrowError,
  ErrorTypeEnum,
} from '@qpqjs/core';

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
  EventDocEventOrigin,
  EventDocOnAppendInput,
  EventDocOnPublishInput,
} from '../models';
import { askEventDocAppendBaseAdvance } from './askEventDocAppendBaseAdvance';
import { askEventDocAppendBaseResolve } from './askEventDocAppendBaseResolve';
import { askEventDocAssertClientEventType } from './askEventDocAssertClientEventType';
import { askEventDocGetByIdOrThrow } from './askEventDocGetByIdOrThrow';
import { askEventDocHookStates } from './askEventDocHookStates';
import { askEventDocSendHeadMoved } from './askEventDocSendHeadMoved';
import { askEventDocSummaryRefold } from './askEventDocSummaryRefold';
import { askEventDocValidateAppend } from './askEventDocValidateAppend';
import { isEventDocReservedEffect } from './isEventDocReservedEffect';

/** Options shared by the single and batch appends (their defaults differ). */
export type EventDocEventAppendOptions = {
  // Run the registered validator against the state at head before the write. True at the client boundary
  // (the append route); server writers may skip it, but should set it when other writers can touch the document.
  validate: boolean;
  // Who authored the event. A client append refuses the collection's server-only types before anything is written;
  // only trusted server code passes `server`. Defaults to client, so a caller that forgets is refused, never trusted.
  origin?: EventDocEventOrigin;
};

const isSlotRaceError = (errorType: string): boolean =>
  errorType === askKeyValueStoreUpsertBase.errorType.Conflict || errorType === askKeyValueStoreUpsertBase.errorType.WriteContention;

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
    // Only the slot race re-laps (the slot is taken, or another write holds it); Invalid and everything else is terminal.
    [askKeyValueStoreUpsertBase.errorType.Conflict, askKeyValueStoreUpsertBase.errorType.WriteContention],
    { linearBackoff: true, maxJitterMs: EVENT_DOC_APPEND_RETRY_MAX_JITTER_MS },
  );

  if (!result.success) {
    if (isSlotRaceError(result.error.errorType)) {
      return yield* askThrowError(
        ErrorTypeEnum.Conflict,
        `Could not append to model ${modelId}: lost the slot race ${EVENT_DOC_APPEND_MAX_RETRIES} times - too much concurrent write contention.`,
      );
    }

    return yield* askThrowError(result.error.errorType, result.error.errorText, result.error.errorStack);
  }

  const event = result.result;

  const refolded = isEventDocReservedEffect(event.type) ? yield* askEventDocSummaryRefold(modelId, event.payload.metadata.eventId) : null;

  // Hooks run outside the retry: a hook that throws Conflict must not re-run the append.
  const { onPublish, onAppend } = yield* askEventDocStoreRead();
  const publishHook = event.type === EventDocEffect.Publish ? onPublish : undefined;

  if (publishHook || onAppend) {
    const summary = refolded ?? (yield* askEventDocGetByIdOrThrow(modelId));
    const { state, previousState } = yield* askEventDocHookStates(modelId, event);

    if (publishHook) {
      yield* askInlineFunctionExecute<void, EventDocOnPublishInput>(publishHook, {
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

  // Best-effort: the event has landed and a subscriber that misses the push catches up on its next refresh.
  yield* askCatch(askEventDocSendHeadMoved(modelId, event));

  return event;
}
