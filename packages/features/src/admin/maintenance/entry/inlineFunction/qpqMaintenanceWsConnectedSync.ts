import { askConfigGetGlobal, AskResponse } from 'quidproquo-core';
import { askServiceFunctionExecute } from 'quidproquo-webserver';

import { askSendMessage } from '../../../../webSocketQueue/logic/webSocket/askSendMessage';
import { WebSocketQueueServerMessageEventType } from '../../../../webSocketQueue/types/serverMessages/WebSocketQueueServerMessageEventType';
import { WebSocketQueueOnConnectedInput } from '../../../../webSocketQueue/types/WebSocketQueueOnConnectedInput';
import { QPQ_ADMIN_SERVICE_NAME_GLOBAL, QPQ_GET_ACTIVE_MAINTENANCES_FUNCTION_NAME } from '../../constants/maintenanceConstants';
import { MaintenancePublicState } from '../../eventDoc/MaintenancePublicState';
import { MaintenanceServerEventMessage } from '../../models/MaintenanceServerEventMessage';

// The websocket queue's onConnected hook (runs in the ws-owning lambda): pull
// the active maintenance set from the admin service and push it to the fresh
// connection — pre-auth on purpose, the maintenance state is public and even a
// login screen should show the banner/lock. ALWAYS sends — an empty set clears
// any maintenance the client believes is still running (e.g. it reconnected
// after a close).
export function* qpqMaintenanceWsConnectedSync(input: WebSocketQueueOnConnectedInput): AskResponse<void> {
  const adminServiceName = yield* askConfigGetGlobal<string>(QPQ_ADMIN_SERVICE_NAME_GLOBAL);

  const maintenances = yield* askServiceFunctionExecute<MaintenancePublicState[], undefined>(
    adminServiceName,
    QPQ_GET_ACTIVE_MAINTENANCES_FUNCTION_NAME,
    undefined,
  );

  yield* askSendMessage(input.connectionId, {
    type: WebSocketQueueServerMessageEventType.Maintenance,
    payload: { maintenances },
  } satisfies MaintenanceServerEventMessage);
}
