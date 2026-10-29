import { AnyEventMessage, askMapParallelBatch, askPagedDataDrain, AskResponse } from '@qpqjs/core';

import { askWebSocketQueueGetConnections } from '../../../../webSocketQueue/logic/webSocket/askWebSocketQueueGetConnections';
import { ADMIN_WEBSOCKET_API_NAME, ADMIN_WEBSOCKET_FAN_OUT_BATCH_SIZE } from '../../../constants';
import { askAdminWebSocketSendMessage } from './askAdminWebSocketSendMessage';

// Sends one message to every logged-in admin client, in batches. Connections without a
// userId are still in the login flow and get nothing.
export function* askAdminWebSocketBroadcast<E extends AnyEventMessage>(message: E): AskResponse<void> {
  const { items: connections } = yield* askPagedDataDrain(function* askConnectionPage(nextPageKey) {
    return yield* askWebSocketQueueGetConnections(ADMIN_WEBSOCKET_API_NAME, true, nextPageKey);
  });

  yield* askMapParallelBatch(connections, ADMIN_WEBSOCKET_FAN_OUT_BATCH_SIZE, function* askSendOnConnection(connection): AskResponse<void> {
    if (connection.userId) {
      yield* askAdminWebSocketSendMessage(connection.id, message);
    }
  });
}
