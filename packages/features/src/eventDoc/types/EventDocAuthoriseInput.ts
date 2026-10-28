import { HTTPEvent } from '@qpqjs/webserver';

import { EventDocPermissionAction } from './EventDocPermissionAction';

/**
 * What a collection's `authorise` inline function receives, inside the request's storage scope. It throws to refuse.
 * `event` is the HTTP request for a route or an MCP call and absent for a websocket chat, which has none; an
 * authoriser must decide from the scope, the store and the action.
 */
export type EventDocAuthoriseInput = {
  event?: HTTPEvent;
  storeName: string;
  action: EventDocPermissionAction;
};
