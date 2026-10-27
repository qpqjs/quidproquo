import { askConfigGetGlobal, AskResponse } from 'quidproquo-core';

import { askWebSocketQueueBroadcastMessage } from '../../../webSocketQueue/logic/webSocket/askWebSocketQueueBroadcastMessage';
import { WebSocketQueueServerMessageEventType } from '../../../webSocketQueue/types/serverMessages/WebSocketQueueServerMessageEventType';
import { QPQ_ADMIN_MAINTENANCE_WS_API_GLOBAL } from '../config/maintenanceWebsocketApiGlobal';
import { MaintenancePublicState } from '../eventDoc/MaintenancePublicState';
import { MaintenanceServerEventMessage } from '../models/MaintenanceServerEventMessage';

// Push the authoritative active-maintenance set to every connection on the
// APPLICATION websocket. No-op when the app configured no maintenance websocket
// (defineAdminSettings maintenanceWebsocketApiName).
export function* askBroadcastMaintenancePublicStates(maintenances: MaintenancePublicState[]): AskResponse<void> {
  const websocketApiName = yield* askConfigGetGlobal<string>(QPQ_ADMIN_MAINTENANCE_WS_API_GLOBAL);

  if (!websocketApiName) {
    return;
  }

  yield* askWebSocketQueueBroadcastMessage<MaintenanceServerEventMessage>(websocketApiName, {
    type: WebSocketQueueServerMessageEventType.Maintenance,
    payload: { maintenances },
  });
}
