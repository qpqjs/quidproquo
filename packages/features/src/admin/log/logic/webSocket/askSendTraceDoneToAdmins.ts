import { askMapParallelBatch, AskResponse, QpqPagedData } from '@qpqjs/core';

import { askWebSocketQueueGetConnections } from '../../../../webSocketQueue/logic/webSocket/askWebSocketQueueGetConnections';
import { Connection } from '../../../../webSocketQueue/types';
import { askSendMessage } from './askSendMessage';
import { WebSocketQueueQpqAdminServerEventMessageTraceDone, WebSocketQueueQpqAdminServerMessageEventType } from './serverMessages';

// Broadcast "trace finished" to every connected admin client. The client watching
// that correlation re-requests the trace route for the stored trace's signed url.
export function* askSendTraceDoneToAdmins(correlation: string, succeeded: boolean, errorText?: string) {
  const traceDoneMessage: WebSocketQueueQpqAdminServerEventMessageTraceDone = {
    type: WebSocketQueueQpqAdminServerMessageEventType.TraceDone,
    payload: {
      correlation,
      succeeded,
      errorText,
    },
  };

  let nextPageKey: string | undefined = undefined;
  do {
    const pageConnections: QpqPagedData<Connection> = yield* askWebSocketQueueGetConnections('qpqadmin', true, nextPageKey);

    yield* askMapParallelBatch(pageConnections.items, 10, function* askSendTraceDoneOnConnection(connection): AskResponse<void> {
      if (connection.userId) {
        yield* askSendMessage(connection.id, traceDoneMessage);
      }
    });

    nextPageKey = pageConnections.nextPageKey;
  } while (nextPageKey);
}
