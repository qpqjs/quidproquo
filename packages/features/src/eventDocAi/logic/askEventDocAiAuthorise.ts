import { askConfigGetGlobal, AskResponse } from '@qpqjs/core';

import { EVENT_DOC_AUTHORISER_GLOBAL, EVENT_DOC_STORE_NAME_GLOBAL } from '../../eventDoc/constants/eventDocGlobalNames';
import { askConfigGetGlobalAddedAfterV1 } from '../../eventDoc/globals/askConfigGetGlobalAddedAfterV1';
import { askEventDocAuthorise } from '../../eventDoc/logic/askEventDocAuthorise';
import { EventDocPermissionAction } from '../../eventDoc/types/EventDocPermissionAction';

/**
 * Runs the collection's `authorise` hook for a websocket chat, which has no store context and no HTTP event, so the
 * authoriser and store name are read from the route's globals first. Must run inside the connection's storage scope.
 */
export function* askEventDocAiAuthorise(action: EventDocPermissionAction): AskResponse<void> {
  const authorise = yield* askConfigGetGlobalAddedAfterV1(EVENT_DOC_AUTHORISER_GLOBAL);
  if (!authorise) {
    return;
  }

  const storeName = yield* askConfigGetGlobal<string>(EVENT_DOC_STORE_NAME_GLOBAL);

  yield* askEventDocAuthorise({ authorise, storeName }, action);
}
