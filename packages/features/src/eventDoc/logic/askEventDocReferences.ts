import { askCatch, AskResponse, askThrowError, createDynamicFunctionCaller } from 'quidproquo-core';

import { eventDocFunctionsName } from '../constants/eventDocFunctionsName';
import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { askEventDocEventListAll } from '../data/askEventDocEventListAll';
import { EventDocInvokableFunctions } from '../definition/types/EventDocInvokableFunctions';
import { EventDocLink } from '../models';
import { isEventDocFunctionsMissing } from './isEventDocFunctionsMissing';

/**
 * Every doc this one has ever linked to, one hop out, across its whole log (the transfer export's read).
 * For current links only use askEventDocReferencesFromState. A collection with no registered definition returns [].
 */
export function* askEventDocReferences(docId: string): AskResponse<EventDocLink[]> {
  const { storeName, type } = yield* askEventDocResolveStore();

  const events = yield* askEventDocEventListAll(docId);

  const functionsCaller = createDynamicFunctionCaller<EventDocInvokableFunctions>(eventDocFunctionsName(storeName, type));
  const collected = yield* askCatch(functionsCaller.collectReferences(events));

  if (!collected.success) {
    if (isEventDocFunctionsMissing(collected.error.errorType)) {
      return [];
    }

    return yield* askThrowError(collected.error.errorType, collected.error.errorText);
  }

  return collected.result;
}
