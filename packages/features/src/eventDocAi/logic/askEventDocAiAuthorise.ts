import { askCatch, askConfigGetGlobal, askInlineFunctionExecute, AskResponse } from '@qpqjs/core';

import { EVENT_DOC_AUTHORISER_GLOBAL, EVENT_DOC_STORE_NAME_GLOBAL } from '../../eventDoc/constants/eventDocGlobalNames';
import { EventDocAuthoriseInput } from '../../eventDoc/types/EventDocAuthoriseInput';
import { EventDocPermissionAction } from '../../eventDoc/types/EventDocPermissionAction';

/**
 * Runs the collection's `authorise` hook for a websocket chat, exactly as its routes and MCP tools do, with no HTTP
 * event to pass. Must run inside the connection's storage scope. A collection without an authoriser is ungated.
 */
export function* askEventDocAiAuthorise(action: EventDocPermissionAction): AskResponse<void> {
  // Handlers registered before the authoriser global existed have no global at all.
  const authorise = yield* askCatch(askConfigGetGlobal<string>(EVENT_DOC_AUTHORISER_GLOBAL));
  if (!authorise.success || !authorise.result) {
    return;
  }

  const storeName = yield* askConfigGetGlobal<string>(EVENT_DOC_STORE_NAME_GLOBAL);

  yield* askInlineFunctionExecute<void, EventDocAuthoriseInput>(authorise.result, { storeName, action });
}
