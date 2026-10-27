import { askInlineFunctionExecute, AskResponse } from 'quidproquo-core';
import { HTTPEvent } from 'quidproquo-webserver';

import { EventDocAuthoriseInput } from '../../eventDoc/types/EventDocAuthoriseInput';
import { EventDocPermissionAction } from '../../eventDoc/types/EventDocPermissionAction';
import { EventDocStore } from '../../eventDoc/types/EventDocStore';

/** Runs the collection's own `authorise` hook (if it has one) exactly as its routes do. Must run inside the call's storage scope. */
export function* askMcpEventDocAiAuthorise(store: EventDocStore, event: HTTPEvent, action: EventDocPermissionAction): AskResponse<void> {
  if (!store.authorise) {
    return;
  }

  yield* askInlineFunctionExecute<void, EventDocAuthoriseInput>(store.authorise, { event, storeName: store.storeName, action });
}
