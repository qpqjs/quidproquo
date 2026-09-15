import { askCatch, AskResponse, askThrowError, createDynamicFunctionCaller, ErrorTypeEnum } from 'quidproquo-core';

import { eventDocFunctionsName } from '../constants/eventDocFunctionsName';
import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { EventDocInvokableFunctions } from '../definition/types/EventDocInvokableFunctions';
import { EventDocEvent } from '../models';

/**
 * The pre-write gate: run the registered `validateEvent` against the state at head and throw Invalid on a rejection,
 * then fold the candidate onto that state and throw Invalid if the fold cannot read it (an unregistered schema
 * version, a throwing reducer). The log is append-only, so an event the fold rejects at read time would brick the
 * document permanently; refusing it here is the only place that can be stopped. Returns the state after the event.
 * Only runs for a registered collection: the caller resolved the head state through this collection's own fold.
 */
export function* askEventDocValidateAppend<S = unknown>(event: EventDocEvent, state: S): AskResponse<S> {
  const { storeName, type } = yield* askEventDocResolveStore();
  const functionsCaller = createDynamicFunctionCaller<EventDocInvokableFunctions>(eventDocFunctionsName(storeName, type));

  const verdict = yield* functionsCaller.validateEvent(event, state);

  if (verdict) {
    return yield* askThrowError(ErrorTypeEnum.Invalid, verdict);
  }

  const folded = yield* askCatch(functionsCaller.foldDocumentState([event], state));

  if (!folded.success) {
    return yield* askThrowError(
      ErrorTypeEnum.Invalid,
      `Refusing to append an event the document fold cannot read (it would be stored permanently and make the document unreadable): ${folded.error.errorText}`,
    );
  }

  // The collection's own fold produced this from an S, so the cast restates provenance.
  return folded.result as S;
}
