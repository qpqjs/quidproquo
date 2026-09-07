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

/**
 * Append a client event to a model's log at the next contiguous position.
 *
 * EXPECTED-VERSION OPTIMISTIC CONCURRENCY. The append resolves the log's head (a
 * consistent read), validates the event against the document state at that head, and
 * writes at head + 1 with a CONDITIONAL put. The slot is claimed atomically, so of two
 * writers that resolved the same head exactly one lands; the other gets the namespaced
 * Upsert Conflict and re-laps. That conditional write is what makes the pre-write
 * verdict sound: the state it validated against is, by construction, the state the event
 * folds onto.
 *
 * A losing lap does NOT start over. It keeps the state it already holds and folds only
 * the events that beat it (askEventDocAppendBaseAdvance: one consistent gap read of a
 * handful of events, never a snapshot lookup, never the log), validates again, and
 * claims the new head + 1. Contention on one document is rare for human editing and
 * bounded by EVENT_DOC_APPEND_MAX_RETRIES when it is not; different documents are
 * different partition keys and never contend.
 *
 * Log order IS commit order, so `afterEventId` cursors and snapshot positions are exact.
 * The fold still applies its own acceptance rules (duplicate clientMessageId, schema
 * version floor, and the collection's validator as defence in depth), but the gate here
 * is the one that stops a bad event from ever entering an append-only log.
 *
 * NOTHING here maintains a read model. The summary is rebuilt from the log by the event
 * store's stream projector (see defineEventDocSummary's `onStream`), so it is eventually
 * consistent and entirely disposable — a projection the writer maintained would be a
 * second source of truth.
 */
// Shared with askEventDocAppendServerEvents, whose default is the opposite (false).
export type EventDocEventAppendOptions = {
  // Run the registered pre-write gate (askEventDocValidateAppend) before the write.
  // TRUE for the append route — the trust boundary, where client-authored events must
  // be stopped before they enter the log. FALSE for server-authored appends
  // (askEventDocAppendServerEvent): server code is trusted to author valid events, the
  // fold remains their gate, and skipping the state resolve keeps the walker's fan-out
  // at one head read + one write per event. Server writers landing on a document that
  // OTHER writers can touch (a human publishing it mid-run) should pass true: a lap
  // that loses the slot race then re-validates against what landed instead of
  // re-laying blindly.
  validate: boolean;
};

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

  // One lap of the slot race. Closes over `base` so a losing lap advances the state it
  // already holds rather than resolving from scratch; `lostLaps` distinguishes the
  // first lap (base freshly resolved) from a retry (base must catch up first).
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
    // The slot race is the ONLY thing worth re-lapping. A domain rejection (Invalid) or
    // anything else is terminal.
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

  // Hooks run after the event is durably written and OUTSIDE the retry: a hook that
  // itself throws the namespaced Conflict must not re-run the append. A hook failure
  // propagates so the caller knows the side effect failed, not the append.
  const { onPublish, onAppend } = yield* askEventDocStoreRead();
  const firePublishHook = !!onPublish && event.type === EventDocEffect.Publish;

  if (firePublishHook || onAppend) {
    // Only read on the hook path. A collection with no hooks (every high-volume one)
    // never pays for these. The states are snapshot-seeded (gap since the nearest
    // snapshot, never the log), so hook cost tracks the burst.
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

    // The every-append hook runs after the publish hook so a broadcast of the
    // fresh fold always observes whatever read model onPublish just synced.
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
