import { AskResponse, QueueEventResponse } from '@qpqjs/core';

import { WebSocketQueueQpqAdminConfigSyncRequestQueueEvent } from '../../../log/logic/webSocket';
import { askAdminConfigSync } from '../../logic/askAdminConfigSync';

export function* onConfigSyncRequest(_event: WebSocketQueueQpqAdminConfigSyncRequestQueueEvent): AskResponse<QueueEventResponse> {
  yield* askAdminConfigSync();

  return true;
}
