import { askCatch, AskResponse, askThrowError, createDynamicFunctionCaller } from 'quidproquo-core';

import { eventDocFunctionsName } from '../constants/eventDocFunctionsName';
import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { EventDocInvokableFunctions } from '../definition/types/EventDocInvokableFunctions';
import { EventDocLink } from '../models';
import { askEventDocDocumentStateLatest } from './askEventDocDocumentStateLatest';
import { isEventDocFunctionsMissing } from './isEventDocFunctionsMissing';

/**
 * Every doc the current state links to, one hop out. Returns [] for a collection with no registered definition
 * and for a doc with no events.
 */
export function* askEventDocReferencesFromState(docId: string): AskResponse<EventDocLink[]> {
  const { storeName, type } = yield* askEventDocResolveStore();

  const functionsCaller = createDynamicFunctionCaller<EventDocInvokableFunctions>(eventDocFunctionsName(storeName, type));

  const stateAtHead = yield* askCatch(askEventDocDocumentStateLatest(docId));

  if (!stateAtHead.success) {
    if (isEventDocFunctionsMissing(stateAtHead.error.errorType)) {
      return [];
    }

    return yield* askThrowError(stateAtHead.error.errorType, stateAtHead.error.errorText);
  }

  if (!stateAtHead.result) {
    return [];
  }

  const collected = yield* askCatch(functionsCaller.collectReferencesFromState(stateAtHead.result.state));

  if (!collected.success) {
    if (isEventDocFunctionsMissing(collected.error.errorType)) {
      return [];
    }

    return yield* askThrowError(collected.error.errorType, collected.error.errorText);
  }

  return collected.result;
}
