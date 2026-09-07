import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

import { askEventDocEventLast } from '../data/askEventDocEventLast';
import { EventDocAppendBase } from '../models';
import { askEventDocDocumentStateAdvance } from './askEventDocDocumentStateAdvance';

/**
 * Move an append base past the events that won the slot race. A base carrying state folds the gap
 * onto it; a head-only base re-reads the head. Both reads are consistent: a stale replica would hand back the head just lost on.
 */
export function* askEventDocAppendBaseAdvance(modelId: string, base: EventDocAppendBase): AskResponse<EventDocAppendBase> {
  if (base.state) {
    const state = yield* askEventDocDocumentStateAdvance(modelId, base.state);

    return { headEventId: state.eventId, state };
  }

  const head = yield* askEventDocEventLast(modelId, { consistentRead: true });

  if (!head) {
    return yield* askThrowError(ErrorTypeEnum.NotFound, `Event log for model ${modelId} vanished mid-append.`);
  }

  return { headEventId: head.payload.metadata.eventId, state: null };
}
