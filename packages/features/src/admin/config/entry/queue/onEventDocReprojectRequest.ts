import { AskResponse, QueueEventResponse } from '@qpqjs/core';

import { askEventDocReprojectOwnedStores } from '../../../../eventDoc/logic/askEventDocReprojectOwnedStores';
import { EventDocReprojectSource } from '../../../../eventDoc/models/EventDocReprojectSource';
import { WebSocketQueueQpqAdminEventDocReprojectRequestQueueEvent } from '../../../log/logic/webSocket';

/**
 * An admin asked for every event doc to be reprojected. The request reaches every service over the admin bus, and each
 * starts a walk of the collections it owns. A source the request does not name, or names wrongly, is the lists store.
 */
export function* onEventDocReprojectRequest(event: WebSocketQueueQpqAdminEventDocReprojectRequestQueueEvent): AskResponse<QueueEventResponse> {
  const requested = event.message.payload?.source;
  const source = requested === EventDocReprojectSource.LegacySummary ? requested : EventDocReprojectSource.Lists;

  yield* askEventDocReprojectOwnedStores(source);

  return true;
}
