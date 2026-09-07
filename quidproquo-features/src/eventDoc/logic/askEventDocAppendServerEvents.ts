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
 * Append a burst of SERVER-AUTHORED events to a model's log in FOUR actions —
 * one clock read, one batch guid mint, one consistent head read, one transactional
 * batch write — where a loop of askEventDocAppendServerEvent pays a head read and a
 * write per event. The batch sibling of that single server append, for the fan-out
 * writers its contract exists for (a flow run's sink streams hundreds of events per run).
 *
 * The events claim the run head + 1 .. head + n as ONE conditional transaction
 * (askEventDocEventWriteMany): every slot lands or none does, so a concurrent writer
 * that took any slot in the run surfaces as the UpsertMany Conflict with nothing
 * written, and the lap re-reads the head and re-lays the whole run above it. Such a
 * writer is rare by design (a run's document has one sink) and a real signal when
 * it happens, which is why the cap is the same as the single append's.
 *
 * Same log out the other end: N ordinary events at consecutive ids (input order is
 * log order), so folds, snapshots, cursors and the stream projector cannot tell a
 * batched burst from a loop of singles.
 *
 * What batching deliberately drops:
 * - NO hooks — hook stores are guarded below, not by caller discipline.
 * - The pre-write gate, UNLESS asked for. The default is write-and-go: server code
 *   is trusted and the fold is its gate, which is what the fan-out sinks need. But a
 *   run landing on a document that other writers can touch (a human can publish it)
 *   should pass `validate: true`: each lap then resolves the state at head and checks
 *   the run event by event (askEventDocValidateAppendRun), so a Publish that landed
 *   in the gap rejects the run with Invalid instead of the fold silently dropping it
 *   at read time. Same option shape as the single append.
 * - A SHARED createdAt: every event in the batch carries the same write instant.
 *   Honest, because metadata.createdAt records the flush, never the occurrence —
 *   an event whose occurrence time matters carries it in its own data.
 * - clientMessageIds come from ONE batch guid mint (askNewSortableGuids: the only
 *   batch guid action; for server appends the field is pure dedup uniqueness, and
 *   the ids' ordering is irrelevant).
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

  // THE GUARD for the no-hooks contract — enforced here, not by caller
  // discipline. A store that later gains onAppend/onPublish must fail loudly
  // the moment a batch tries to bypass its hooks (a silently-skipped hook is a
  // read model that quietly stops syncing); likewise a Publish inside a batch
  // would skip the publish hook. Both are zero-I/O checks (the store context is
  // a local read).
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

  // One lap of the run's slot race: lay the whole burst above the head this lap holds.
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
    [askKeyValueStoreUpsertManyBase.errorType.Conflict],
    { linearBackoff: true, maxJitterMs: EVENT_DOC_APPEND_RETRY_MAX_JITTER_MS },
  );

  if (!result.success) {
    if (result.error.errorType === askKeyValueStoreUpsertManyBase.errorType.Conflict) {
      return yield* askThrowError(
        ErrorTypeEnum.Conflict,
        `Could not append ${inputs.length} events to model ${modelId}: lost the slot race ${EVENT_DOC_APPEND_MAX_RETRIES} times - another writer is on this document.`,
      );
    }

    return yield* askThrowError(result.error.errorType, result.error.errorText, result.error.errorStack);
  }

  return result.result;
}
