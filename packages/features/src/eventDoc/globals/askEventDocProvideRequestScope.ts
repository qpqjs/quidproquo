import { askInlineFunctionExecute, AskResponse, askStorageScopeProvide, Nullable } from 'quidproquo-core';
import { HTTPEvent } from 'quidproquo-webserver';

import { askEventDocStoreRead } from '../context/askEventDocStoreRead';
import { EventDocAuthoriseInput } from '../types/EventDocAuthoriseInput';
import { EventDocPermissionAction } from '../types/EventDocPermissionAction';

// The collection's authoriser runs inside the resolved scope, so it can read the active tenant. A story that names
// no action (a custom route deciding its own authority) skips it.
function* askAuthoriseThenRun<T>(event: HTTPEvent, story: AskResponse<T>, action?: EventDocPermissionAction): AskResponse<T> {
  const { authorise, storeName } = yield* askEventDocStoreRead();

  if (authorise && action) {
    yield* askInlineFunctionExecute<void, EventDocAuthoriseInput>(authorise, { event, storeName, action });
  }

  return yield* story;
}

/**
 * Runs the story under the storage scope returned by the collection's `scopeResolver` inline function, after the
 * collection's `authorise` inline function has allowed `action`. No resolver, or a null result, runs it unscoped.
 * Requires the store context.
 */
export function* askEventDocProvideRequestScope<T>(event: HTTPEvent, story: AskResponse<T>, action?: EventDocPermissionAction): AskResponse<T> {
  const { scopeResolver } = yield* askEventDocStoreRead();

  if (!scopeResolver) {
    return yield* askAuthoriseThenRun(event, story, action);
  }

  const scope = yield* askInlineFunctionExecute<Nullable<string>, { event: HTTPEvent }>(scopeResolver, { event });

  if (!scope) {
    return yield* askAuthoriseThenRun(event, story, action);
  }

  return yield* askStorageScopeProvide(scope, askAuthoriseThenRun(event, story, action));
}
