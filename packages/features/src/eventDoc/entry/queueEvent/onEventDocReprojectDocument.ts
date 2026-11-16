import { askConfigGetGlobal, AskResponse, QueueEvent, QueueEventResponse, QueueMessage } from '@qpqjs/core';

import { EVENT_DOC_SNAPSHOT_FUNCTIONS_GLOBAL, EVENT_DOC_STORE_NAME_GLOBAL } from '../../constants/eventDocGlobalNames';
import { askEventDocReprojectDocument } from '../../logic/askEventDocReprojectDocument';
import { EventDocReprojectTarget } from '../../models';

/**
 * Reproject queue handler: re-run the projector at one document's head. The store name and its map of doc type to
 * registered functions arrive as function globals, the same two the stream projector is handed.
 */
export function* onEventDocReprojectDocument(event: QueueEvent<QueueMessage<EventDocReprojectTarget>>): AskResponse<QueueEventResponse> {
  const storeName = yield* askConfigGetGlobal<string>(EVENT_DOC_STORE_NAME_GLOBAL);
  const snapshotFunctions = yield* askConfigGetGlobal<Record<string, string>>(EVENT_DOC_SNAPSHOT_FUNCTIONS_GLOBAL);

  yield* askEventDocReprojectDocument(storeName, event.message.payload, snapshotFunctions);

  return true;
}
