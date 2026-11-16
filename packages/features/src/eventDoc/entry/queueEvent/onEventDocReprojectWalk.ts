import { askConfigGetGlobal, AskResponse, QueueEvent, QueueEventResponse, QueueMessage } from '@qpqjs/core';

import { EVENT_DOC_STORE_NAME_GLOBAL } from '../../constants/eventDocGlobalNames';
import { askEventDocReprojectWalk } from '../../logic/askEventDocReprojectWalk';
import { EventDocReprojectWalkPayload } from '../../models';

/** Reproject queue handler: one step of a walk over the collection's documents. The store name arrives as a function global. */
export function* onEventDocReprojectWalk(event: QueueEvent<QueueMessage<EventDocReprojectWalkPayload>>): AskResponse<QueueEventResponse> {
  const storeName = yield* askConfigGetGlobal<string>(EVENT_DOC_STORE_NAME_GLOBAL);

  yield* askEventDocReprojectWalk(storeName, event.message.payload);

  return true;
}
