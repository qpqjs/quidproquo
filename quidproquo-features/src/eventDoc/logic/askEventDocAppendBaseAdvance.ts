import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

import { askEventDocEventLast } from '../data/askEventDocEventLast';
import { EventDocAppendBase } from '../models';
import { askEventDocDocumentStateAdvance } from './askEventDocDocumentStateAdvance';

/**
 * Move an append base past the events that beat it to the slot. A base carrying state
 * folds the gap onto the state it already holds (askEventDocDocumentStateAdvance); a
 * head-only base just re-reads the head. Both are consistent reads: the loser is racing
 * the winner's write, and a stale replica would hand back the same head it just lost on.
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
