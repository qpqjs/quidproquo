import { AskResponse } from 'quidproquo-core';

import { webSocketConnectionData } from '../../../data';
import {
  AnyWebSocketQueueEventMessageWithCorrelation,
  WebSocketQueueClientEventMessageUnauthenticate,
  WebSocketQueueClientMessageEventType,
  WebSocketQueueServerEventMessageUnauthenticated,
  WebSocketQueueServerMessageEventType,
} from '../../../types';
import { askSendMessage } from '../askSendMessage';

export function isWebSocketUnauthenticateMessage(
  event: AnyWebSocketQueueEventMessageWithCorrelation,
): event is WebSocketQueueClientEventMessageUnauthenticate {
  return event.type === WebSocketQueueClientMessageEventType.Unauthenticate;
}

export function* askProcessOnUnauthenticate(connectionId: string): AskResponse<void> {
  const connection = yield* webSocketConnectionData.askGetById(connectionId);
  if (!connection) {
    return;
  }

  // Remove the user id, access token and any claimed storage scope: an
  // unauthenticated connection must never keep stamping a tenant onto messages
  const { userId, accessToken, scope, ...connectionWithNoUserInfo } = connection;

  if (connection) {
    yield* webSocketConnectionData.askUpsert(connectionWithNoUserInfo);
  }

  yield* askSendMessage(connectionId, {
    type: WebSocketQueueServerMessageEventType.Unauthenticated,
  } satisfies WebSocketQueueServerEventMessageUnauthenticated);
}
