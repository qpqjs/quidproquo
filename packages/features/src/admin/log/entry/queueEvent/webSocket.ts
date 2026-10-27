import { AskResponse, QueueEventResponse } from 'quidproquo-core';

import { logsLogic, WebSocketQueueQpqAdminMarkLogCheckedQueueEvent, WebSocketQueueQpqAdminRefreshLogMetadataQueueEvent } from '../../logic';

export function* onMarkLogChecked(event: WebSocketQueueQpqAdminMarkLogCheckedQueueEvent): AskResponse<QueueEventResponse> {
  yield* logsLogic.askToggleLogChecked(event.message.payload.correlationId, event.message.payload.checked);

  return true;
}

export function* onRefreshLogMetadata(event: WebSocketQueueQpqAdminRefreshLogMetadataQueueEvent): AskResponse<QueueEventResponse> {
  yield* logsLogic.askAnnounceLogMetadataByCorrelationId(event.message.payload.correlationId);

  return true;
}
