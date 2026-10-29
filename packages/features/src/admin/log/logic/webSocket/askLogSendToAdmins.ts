import { askMapParallelBatch, AskResponse, QpqPagedData, StoryResultMetadata } from '@qpqjs/core';

import { askWebSocketQueueGetConnections } from '../../../../webSocketQueue/logic/webSocket/askWebSocketQueueGetConnections';
import { Connection } from '../../../../webSocketQueue/types';
import { ADMIN_WEBSOCKET_API_NAME, ADMIN_WEBSOCKET_FAN_OUT_BATCH_SIZE } from '../../../constants';
import { askAdminWebSocketSendMessage } from './askAdminWebSocketSendMessage';
import { WebSocketQueueQpqAdminServerEventMessageLogMetadata, WebSocketQueueQpqAdminServerMessageEventType } from './serverMessages';

export function* askLogSendToAdmins(log: StoryResultMetadata) {
  const logMessage: WebSocketQueueQpqAdminServerEventMessageLogMetadata = {
    type: WebSocketQueueQpqAdminServerMessageEventType.LogMetadata,
    payload: {
      log,
    },
  };

  let nextPageKey: string | undefined = undefined;
  do {
    const pageConnections: QpqPagedData<Connection> = yield* askWebSocketQueueGetConnections(ADMIN_WEBSOCKET_API_NAME, true, nextPageKey);

    yield* askMapParallelBatch(
      pageConnections.items,
      ADMIN_WEBSOCKET_FAN_OUT_BATCH_SIZE,
      function* askSendLogOnConnection(connection): AskResponse<void> {
        if (connection.userId) {
          yield* askAdminWebSocketSendMessage(connection.id, logMessage);
        }
      },
    );

    nextPageKey = pageConnections.nextPageKey;
  } while (nextPageKey);
}
