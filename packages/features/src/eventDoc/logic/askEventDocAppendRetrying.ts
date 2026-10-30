import { AskResponse, askRetry, askThrowError, ErrorTypeEnum } from '@qpqjs/core';

import {
  EVENT_DOC_APPEND_MAX_RETRIES,
  EVENT_DOC_APPEND_RETRY_BASE_WAIT_MS,
  EVENT_DOC_APPEND_RETRY_MAX_JITTER_MS,
} from '../constants/eventDocAppendRetry';
import { EventDocAppendBase, EventDocEvent } from '../models';
import { askEventDocAppendBaseAdvance } from './askEventDocAppendBaseAdvance';
import { askEventDocAppendBaseResolve } from './askEventDocAppendBaseResolve';
import { askEventDocValidateAppendRun } from './askEventDocValidateAppendRun';

export type EventDocAppendLap<T extends EventDocEvent[]> = {
  // The events to claim from head + 1 on, built again from the advanced base on every lap.
  buildEvents: (base: EventDocAppendBase) => T;
  // The conditional write; its slot race errors are the ones that re-lap.
  askWrite: (modelId: string, events: T) => AskResponse<void>;
  slotRaceErrorTypes: string[];
  // The Conflict text once every lap has been lost.
  contentionText: string;
};

/**
 * The one append lap: resolve the head, build the events on it, validate them against the state at head when the
 * collection asked for it, and write conditionally. A slot race (the slot is taken, or another write holds it)
 * advances the held state past the winners and laps again, up to EVENT_DOC_APPEND_MAX_RETRIES; Invalid and every
 * other failure is terminal and rethrown as is.
 */
export function* askEventDocAppendRetrying<T extends EventDocEvent[]>(modelId: string, validate: boolean, lap: EventDocAppendLap<T>): AskResponse<T> {
  let base: EventDocAppendBase = yield* askEventDocAppendBaseResolve(modelId, validate);
  let lostLaps = 0;

  function* askAppendLap(): AskResponse<T> {
    if (lostLaps > 0) {
      base = yield* askEventDocAppendBaseAdvance(modelId, base);
    }
    lostLaps += 1;

    const events = lap.buildEvents(base);

    if (base.state) {
      yield* askEventDocValidateAppendRun(events, base.state.state);
    }

    yield* lap.askWrite(modelId, events);

    return events;
  }

  const result = yield* askRetry(askAppendLap, EVENT_DOC_APPEND_MAX_RETRIES, EVENT_DOC_APPEND_RETRY_BASE_WAIT_MS, lap.slotRaceErrorTypes, {
    linearBackoff: true,
    maxJitterMs: EVENT_DOC_APPEND_RETRY_MAX_JITTER_MS,
  });

  if (!result.success) {
    if (lap.slotRaceErrorTypes.includes(result.error.errorType)) {
      return yield* askThrowError(ErrorTypeEnum.Conflict, lap.contentionText);
    }

    return yield* askThrowError(result.error.errorType, result.error.errorText, result.error.errorStack);
  }

  return result.result;
}
