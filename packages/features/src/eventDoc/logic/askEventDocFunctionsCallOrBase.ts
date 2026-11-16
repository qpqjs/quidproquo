import { askCatch, AskResponse, askThrowError } from '@qpqjs/core';

import { isEventDocFunctionsMissing } from './isEventDocFunctionsMissing';

/**
 * Run a call on the collection's registered functions, and answer it from `base` when nothing is registered for the
 * collection (or the registration has no such member). Any other failure stays loud: a registered object that cannot
 * load must not be mistaken for an absent one.
 */
export function* askEventDocFunctionsCallOrBase<TResult>(call: AskResponse<TResult>, base: () => TResult): AskResponse<TResult> {
  const called = yield* askCatch(call);

  if (called.success) {
    return called.result;
  }

  if (isEventDocFunctionsMissing(called.error.errorType)) {
    return base();
  }

  return yield* askThrowError(called.error.errorType, called.error.errorText);
}
