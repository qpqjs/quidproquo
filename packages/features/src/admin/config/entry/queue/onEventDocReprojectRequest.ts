import { AskResponse, QueueEventResponse } from '@qpqjs/core';

import { askEventDocReprojectOwnedStores } from '../../../../eventDoc/logic/askEventDocReprojectOwnedStores';
import { WebSocketQueueQpqAdminEventDocReprojectRequestQueueEvent } from '../../../log/logic/webSocket';

/**
 * An admin asked for every event doc to be reprojected. The request reaches every service over the admin bus, and each
 * starts a walk of the collections it owns.
 */
export function* onEventDocReprojectRequest(_event: WebSocketQueueQpqAdminEventDocReprojectRequestQueueEvent): AskResponse<QueueEventResponse> {
  yield* askEventDocReprojectOwnedStores();

  return true;
}
