import { askMapParallelBatch, AskResponse } from 'quidproquo-core';

import { askWebSocketQueueGetConnections } from '../../../../webSocketQueue/logic/webSocket/askWebSocketQueueGetConnections';
import { askSendMessage } from './askSendMessage';
import { WebSocketQueueQpqAdminServerEventMessageTraceDone, WebSocketQueueQpqAdminServerMessageEventType } from './serverMessages';

// Broadcast "trace finished" to every connected admin client — the client watching
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
    const pageConnections = yield* askWebSocketQueueGetConnections('qpqadmin', true);

    yield* askMapParallelBatch(pageConnections.items, 10, function* askSendTraceDoneOnConnection(connection): AskResponse<void> {
      if (connection.userId) {
        yield* askSendMessage(connection.id, traceDoneMessage);
      }
    });

    nextPageKey = pageConnections.nextPageKey;
  } while (nextPageKey);
}
