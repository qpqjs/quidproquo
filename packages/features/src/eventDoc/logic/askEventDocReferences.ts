import { askCatch, AskResponse, askThrowError, createDynamicFunctionCaller } from '@qpqjs/core';

import { eventDocFunctionsName } from '../constants/eventDocFunctionsName';
import { askEventDocStoreReadOrThrow } from '../context/askEventDocStoreReadOrThrow';
import { askEventDocEventListAll } from '../data/askEventDocEventListAll';
import { EventDocInvokableFunctions } from '../definition/types/EventDocInvokableFunctions';
import { EventDocLink } from '../models';
import { isEventDocFunctionsMissing } from './isEventDocFunctionsMissing';

/**
 * Every doc this one has ever linked to, one hop out, across its whole log (the transfer export's read).
 * For current links only use askEventDocReferencesFromState. A collection with no registered definition returns [].
 */
export function* askEventDocReferences(docId: string): AskResponse<EventDocLink[]> {
  const { storeName, type } = yield* askEventDocStoreReadOrThrow();

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
