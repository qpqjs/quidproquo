import { askCatch, AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

import { askEventDocEventLast } from '../data/askEventDocEventLast';
import { EventDocAppendBase } from '../models';
import { askEventDocDocumentStateLatest } from './askEventDocDocumentStateLatest';
import { isEventDocFunctionsMissing } from './isEventDocFunctionsMissing';

/**
 * The base an append lands on: the log's head (consistent read, since the append claims head + 1) plus,
 * when `validate` is set, the document state at that head. A collection with no registered definition
 * degrades to the head alone. Throws NotFound for a log with no events (every real log opens with INIT_STATE).
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
