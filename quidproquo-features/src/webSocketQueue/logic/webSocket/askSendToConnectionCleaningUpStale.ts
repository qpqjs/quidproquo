import { askCatch, AskResponse } from 'quidproquo-core';
import { askWebsocketSendMessage, askWebsocketSendMessageBase } from 'quidproquo-webserver';

import { askWebsocketReadApiNameOrThrow } from '../../context';
import { webSocketConnectionData } from '../../data/connectionData';
import { webSocketSubscriptionData } from '../../data/subscriptionData';
import { AnyWebSocketQueueEventMessageWithCorrelation } from '../../types';

/**
 * A send that never throws: the connection store can hold records for sockets that died without their onDisconnect
 * firing, and one dead connection must not abort a multi-connection send. A Disconnected failure deletes the stale
 * connection and its subscriptions so the stores self-heal; any other failure (e.g. Throttled) just drops this message
 * for this connection. Returns whether the send succeeded.
 */
export function* askSendToConnectionCleaningUpStale(
  connectionId: string,
  payload: AnyWebSocketQueueEventMessageWithCorrelation,
): AskResponse<boolean> {
  const apiName = yield* askWebsocketReadApiNameOrThrow();
  const result = yield* askCatch(askWebsocketSendMessage(apiName, connectionId, payload));

  if (result.success) {
    return true;
  }

  if (result.error.errorType === askWebsocketSendMessageBase.errorType.Disconnected) {
    yield* webSocketConnectionData.askDeleteByConnectionId(connectionId);
    yield* webSocketSubscriptionData.askDeleteByConnectionId(connectionId);
  }

  return false;
}
