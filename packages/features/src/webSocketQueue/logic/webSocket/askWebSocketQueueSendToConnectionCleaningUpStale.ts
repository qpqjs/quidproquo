import { askCatch, askLogCreate, AskResponse, LogLevelEnum } from '@qpqjs/core';
import { askWebsocketSendMessage, askWebsocketSendMessageBase } from '@qpqjs/webserver';

import { askWebsocketApiNameReadOrThrow } from '../../context';
import { webSocketConnectionData } from '../../data';
import { webSocketSubscriptionData } from '../../data/subscriptionData';
import { AnyWebSocketQueueEventMessageWithCorrelation } from '../../types';

/**
 * A send that never throws: the connection store can hold records for sockets that died without their onDisconnect
 * firing, and one dead connection must not abort a multi-connection send. A Disconnected failure deletes the stale
 * connection and its subscriptions so the stores self-heal; any other failure (e.g. Throttled, TooLarge) drops this
 * message for this connection and logs a warning, so a lost message can be found. Returns whether the send succeeded.
 */
export function* askWebSocketQueueSendToConnectionCleaningUpStale(
  connectionId: string,
  payload: AnyWebSocketQueueEventMessageWithCorrelation,
): AskResponse<boolean> {
  const apiName = yield* askWebsocketApiNameReadOrThrow();
  const result = yield* askCatch(askWebsocketSendMessage(apiName, connectionId, payload));

  if (result.success) {
    return true;
  }

  if (result.error.errorType === askWebsocketSendMessageBase.errorType.Disconnected) {
    yield* webSocketConnectionData.askConnectionDeleteByConnectionId(connectionId);
    yield* webSocketSubscriptionData.askConnectionDeleteByConnectionId(connectionId);

    return false;
  }

  yield* askLogCreate(LogLevelEnum.Warn, 'webSocketQueue: a message could not be sent and was dropped', {
    connectionId,
    messageType: payload.type,
    messageBytes: new TextEncoder().encode(JSON.stringify(payload)).length,
    errorType: result.error.errorType,
    errorText: result.error.errorText,
  });

  return false;
}
