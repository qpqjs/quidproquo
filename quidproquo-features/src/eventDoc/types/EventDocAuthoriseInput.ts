import { HTTPEvent } from 'quidproquo-webserver';

import { EventDocPermissionAction } from './EventDocPermissionAction';

/** What a collection's `authorise` inline function receives, inside the request's storage scope. It throws to refuse. */
export type EventDocAuthoriseInput = {
  event: HTTPEvent;
  storeName: string;
  action: EventDocPermissionAction;
};
