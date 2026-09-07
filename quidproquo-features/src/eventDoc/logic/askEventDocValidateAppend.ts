import { askCatch, AskResponse, askThrowError, createDynamicFunctionCaller, ErrorTypeEnum } from 'quidproquo-core';

import { eventDocFunctionsName } from '../constants/eventDocFunctionsName';
import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { EventDocInvokableFunctions } from '../definition/types/EventDocInvokableFunctions';
import { EventDocEvent } from '../models';
import { isEventDocFunctionsMissing } from './isEventDocFunctionsMissing';

/**
 * The pre-write gate: run the registered `validateEvent` against the state at head and throw Invalid on a rejection.
 * A collection with no validator passes.
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
