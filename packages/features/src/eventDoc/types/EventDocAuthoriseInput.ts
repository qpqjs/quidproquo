import { HTTPEvent } from '@qpqjs/webserver';

import { EventDocPermissionAction } from './EventDocPermissionAction';

/**
 * What a collection's `authorise` inline function receives, inside the request's storage scope. It throws to refuse.
 * `event` is the HTTP request for a route or an MCP call and absent for a websocket chat, which has none. A chat names
 * the document it is opened on as `docId` instead, so its authoriser can still decide per document.
 */
export type EventDocAuthoriseInput = {
  event?: HTTPEvent;
  docId?: string;
  storeName: string;
  action: EventDocPermissionAction;
};
