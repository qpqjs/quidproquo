import { askMapParallelBatch, askPagedDataDrain, AskResponse } from '@qpqjs/core';

import { askWebSocketQueueGetConnections } from '../../../../webSocketQueue/logic/webSocket/askWebSocketQueueGetConnections';
import { ADMIN_WEBSOCKET_API_NAME, ADMIN_WEBSOCKET_FAN_OUT_BATCH_SIZE } from '../../../constants';
import { askAdminWebSocketSendMessage } from './askAdminWebSocketSendMessage';
import { WebSocketQueueQpqAdminServerEventMessageTraceDone, WebSocketQueueQpqAdminServerMessageEventType } from './serverMessages';

// Broadcast "trace finished" to every connected admin client. The client watching
// that correlation re-requests the trace route for the stored trace's signed url.
export function* askLogSendTraceDoneToAdmins(correlation: string, succeeded: boolean, errorText?: string) {
  const traceDoneMessage: WebSocketQueueQpqAdminServerEventMessageTraceDone = {
    type: WebSocketQueueQpqAdminServerMessageEventType.TraceDone,
    payload: {
      correlation,
      succeeded,
      errorText,
    },
  };

  const { items: connections } = yield* askPagedDataDrain(function* askConnectionPage(nextPageKey) {
    return yield* askWebSocketQueueGetConnections(ADMIN_WEBSOCKET_API_NAME, true, nextPageKey);
  });

  yield* askMapParallelBatch(connections, ADMIN_WEBSOCKET_FAN_OUT_BATCH_SIZE, function* askSendTraceDoneOnConnection(connection): AskResponse<void> {
    if (connection.userId) {
      yield* askAdminWebSocketSendMessage(connection.id, traceDoneMessage);
    }
  });
}
