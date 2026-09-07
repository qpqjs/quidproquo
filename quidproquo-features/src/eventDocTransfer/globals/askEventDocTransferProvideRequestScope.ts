import { askConfigGetGlobal, askInlineFunctionExecute, AskResponse, askStorageScopeProvide, Nullable } from 'quidproquo-core';
import { HTTPEvent } from 'quidproquo-webserver';

import { EVENT_DOC_TRANSFER_SCOPE_RESOLVER_GLOBAL } from '../constants';

/**
 * Runs the story under the storage scope returned by the transfer's scope resolver global.
 * Separate from askEventDocProvideRequestScope because a transfer spans collections, so there is no one store to read from.
 */
export function* askEventDocTransferProvideRequestScope<T>(event: HTTPEvent, story: AskResponse<T>): AskResponse<T> {
  const scopeResolver = yield* askConfigGetGlobal<string>(EVENT_DOC_TRANSFER_SCOPE_RESOLVER_GLOBAL);

  if (!scopeResolver) {
    return yield* story;
  }

  const scope = yield* askInlineFunctionExecute<Nullable<string>, { event: HTTPEvent }>(scopeResolver, { event });

  if (!scope) {
    return yield* story;
  }

  return yield* askStorageScopeProvide(scope, story);
}
