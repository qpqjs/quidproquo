import { askMapParallelBatch, AskResponse, QpqPagedData, StoryResultMetadata } from '@qpqjs/core';

import { askWebSocketQueueGetConnections } from '../../../../webSocketQueue/logic/webSocket/askWebSocketQueueGetConnections';
import { Connection } from '../../../../webSocketQueue/types';
import { ADMIN_WEBSOCKET_FAN_OUT_BATCH_SIZE } from '../../../constants';
import { askSendMessage } from './askSendMessage';
import { WebSocketQueueQpqAdminServerEventMessageLogMetadata, WebSocketQueueQpqAdminServerMessageEventType } from './serverMessages';

export function* askSendLogToAdmins(log: StoryResultMetadata) {
  const logMessage: WebSocketQueueQpqAdminServerEventMessageLogMetadata = {
    type: WebSocketQueueQpqAdminServerMessageEventType.LogMetadata,
    payload: {
      log,
    },
  };

  let nextPageKey: string | undefined = undefined;
  do {
    const pageConnections: QpqPagedData<Connection> = yield* askWebSocketQueueGetConnections('qpqadmin', true, nextPageKey);

    yield* askMapParallelBatch(
      pageConnections.items,
      ADMIN_WEBSOCKET_FAN_OUT_BATCH_SIZE,
      function* askSendLogOnConnection(connection): AskResponse<void> {
        if (connection.userId) {
          yield* askSendMessage(connection.id, logMessage);
        }
      },
    );

    nextPageKey = pageConnections.nextPageKey;
  } while (nextPageKey);
}
