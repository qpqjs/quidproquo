import { askCatch, AskResponse, askThrowError, createDynamicFunctionCaller, ErrorTypeEnum } from 'quidproquo-core';

import { eventDocFunctionsName } from '../constants/eventDocFunctionsName';
import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { EventDocInvokableFunctions } from '../definition/types/EventDocInvokableFunctions';
import { EventDocEvent } from '../models';
import { isEventDocFunctionsMissing } from './isEventDocFunctionsMissing';

/**
 * The append path's pre-write gate: run the collection's registered `validateEvent`
 * against `state` (the document as of the head the event will follow) and throw Invalid
 * on a rejection, so the event never enters the log. The write that follows is
 * conditional on that same head, which is what makes this verdict sound: if anything
 * lands in between, the write fails and the caller validates again against the advanced
 * state.
 *
 * A collection whose definition predates `validateEvent` (functions missing on the
 * member) passes: there is no rule to apply.
 */
export function* askEventDocValidateAppend(event: EventDocEvent, state: unknown): AskResponse<void> {
  const { storeName, type } = yield* askEventDocResolveStore();
  const functionsCaller = createDynamicFunctionCaller<EventDocInvokableFunctions>(eventDocFunctionsName(storeName, type));

  const verdict = yield* askCatch(functionsCaller.validateEvent(event, state));

  if (!verdict.success) {
    if (isEventDocFunctionsMissing(verdict.error.errorType)) {
      return;
    }

    return yield* askThrowError(verdict.error.errorType, verdict.error.errorText);
  }

  if (verdict.result) {
    return yield* askThrowError(ErrorTypeEnum.Invalid, verdict.result);
  }
}
