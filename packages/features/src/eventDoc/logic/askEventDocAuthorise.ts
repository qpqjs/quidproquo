import { askInlineFunctionExecute, AskResponse } from '@qpqjs/core';
import { HTTPEvent } from '@qpqjs/webserver';

import { EventDocAuthoriseInput } from '../types/EventDocAuthoriseInput';
import { EventDocPermissionAction } from '../types/EventDocPermissionAction';
import { EventDocStore } from '../types/EventDocStore';

/**
 * Runs the collection's `authorise` inline function for `action`, the one way for a route, an MCP call and a
 * websocket chat (which has no `event` and passes the `docId` it is opened on). Must run inside the request's storage
 * scope. A collection without an authoriser is ungated.
 */
export function* askEventDocAuthorise(
  store: Pick<EventDocStore, 'authorise' | 'storeName'>,
  action: EventDocPermissionAction,
  event?: HTTPEvent,
  docId?: string,
): AskResponse<void> {
  if (!store.authorise) {
    return;
  }

  yield* askInlineFunctionExecute<void, EventDocAuthoriseInput>(store.authorise, {
    ...(event ? { event } : {}),
    ...(docId ? { docId } : {}),
    storeName: store.storeName,
    action,
  });
}
