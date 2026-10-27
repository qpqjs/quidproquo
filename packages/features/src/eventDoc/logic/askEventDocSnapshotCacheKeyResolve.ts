import { askCatch, AskResponse, askThrowError, createDynamicFunctionCaller } from 'quidproquo-core';

import { eventDocFunctionsName } from '../constants/eventDocFunctionsName';
import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { EventDocInvokableFunctions } from '../definition/types/EventDocInvokableFunctions';
import { isEventDocFunctionsMissing } from './isEventDocFunctionsMissing';

/**
 * The snapshot cache key the current collection files its snapshots under, read off its registered definition. A
 * collection with no registered definition (or one predating the member) resolves to '' — the legacy layout — so the
 * readers that already tolerate a missing definition keep working unchanged. `functionsName` overrides the registry
 * name derived from the store context (the projector is handed its name by config).
 */
export function* askEventDocSnapshotCacheKeyResolve(functionsName?: string): AskResponse<string> {
  const { storeName, type } = yield* askEventDocResolveStore();
  const functionsCaller = createDynamicFunctionCaller<EventDocInvokableFunctions>(functionsName ?? eventDocFunctionsName(storeName, type));

  const resolved = yield* askCatch(functionsCaller.getSnapshotCacheKey());

  if (resolved.success) {
    return resolved.result ?? '';
  }

  if (isEventDocFunctionsMissing(resolved.error.errorType)) {
    return '';
  }

  return yield* askThrowError(resolved.error.errorType, resolved.error.errorText);
}
