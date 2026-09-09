import { askInlineFunctionExecute, AskResponse, askStorageScopeProvide, Nullable } from 'quidproquo-core';
import { HTTPEvent } from 'quidproquo-webserver';

import { askEventDocStoreRead } from '../context/askEventDocStoreRead';

/**
 * Runs the story under the storage scope returned by the collection's `scopeResolver` inline function.
 * No resolver, or a null result, runs it unscoped. Requires the store context.
 */
export function* askEventDocProvideRequestScope<T>(event: HTTPEvent, story: AskResponse<T>): AskResponse<T> {
  const { scopeResolver } = yield* askEventDocStoreRead();

  if (!scopeResolver) {
    return yield* story;
  }

  const scope = yield* askInlineFunctionExecute<Nullable<string>, { event: HTTPEvent }>(scopeResolver, { event });

  if (!scope) {
    return yield* story;
  }

  return yield* askStorageScopeProvide(scope, story);
}
