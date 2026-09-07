import { askCatch, AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

import { askEventDocEventLast } from '../data/askEventDocEventLast';
import { EventDocAppendBase } from '../models';
import { askEventDocDocumentStateLatest } from './askEventDocDocumentStateLatest';
import { isEventDocFunctionsMissing } from './isEventDocFunctionsMissing';

/**
 * The base an append lands on: the log's head, CONSISTENTLY read (the whole point of
 * claiming head + 1 is that the head is exactly right), plus the document state at that
 * head when the append will be validated against it.
 *
 * `validate` asks for the state. It resolves snapshot-seeded (cost tracks the gap since
 * the nearest snapshot, never the log) through the collection's registered definition; a
 * collection with NO definition (functions missing) has nothing to validate with and
 * degrades to the head alone, keeping the original write-and-go contract for it.
 *
 * A log with no events has no head to append after: every real log opens with INIT_STATE
 * (askEventDocSeedInitState), so that is a missing document, not an empty base.
 */
export function* askEventDocAppendBaseResolve(modelId: string, validate: boolean): AskResponse<EventDocAppendBase> {
  if (validate) {
    const stateAtHead = yield* askCatch(askEventDocDocumentStateLatest(modelId, { consistentRead: true }));

    if (stateAtHead.success) {
      if (!stateAtHead.result) {
        return yield* askThrowError(ErrorTypeEnum.NotFound, `No event log for model ${modelId} - it has no INIT_STATE.`);
      }

      return { headEventId: stateAtHead.result.eventId, state: stateAtHead.result };
    }

    if (!isEventDocFunctionsMissing(stateAtHead.error.errorType)) {
      return yield* askThrowError(stateAtHead.error.errorType, stateAtHead.error.errorText);
    }
  }

  const head = yield* askEventDocEventLast(modelId, { consistentRead: true });

  if (!head) {
    return yield* askThrowError(ErrorTypeEnum.NotFound, `No event log for model ${modelId} - it has no INIT_STATE.`);
  }

  return { headEventId: head.payload.metadata.eventId, state: null };
}
