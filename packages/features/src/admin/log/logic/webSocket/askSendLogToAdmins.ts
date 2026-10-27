import { askMapParallelBatch, AskResponse, StoryResultMetadata } from 'quidproquo-core';

import { askWebSocketQueueGetConnections } from '../../../../webSocketQueue/logic/webSocket/askWebSocketQueueGetConnections';
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
    const pageConnections = yield* askWebSocketQueueGetConnections('qpqadmin', true);

    yield* askMapParallelBatch(pageConnections.items, 10, function* askSendLogOnConnection(connection): AskResponse<void> {
      if (connection.userId) {
        yield* askSendMessage(connection.id, logMessage);
      }
    });

    nextPageKey = pageConnections.nextPageKey;
  } while (nextPageKey);
}
