import { AskResponse } from '@qpqjs/core';

import { webSocketConnectionData } from '../../../data';
import {
  AnyWebSocketQueueEventMessageWithCorrelation,
  WebSocketQueueClientEventMessageUnauthenticate,
  WebSocketQueueClientMessageEventType,
  WebSocketQueueServerEventMessageUnauthenticated,
  WebSocketQueueServerMessageEventType,
} from '../../../types';
import { askWebSocketQueueSendMessage } from '../askWebSocketQueueSendMessage';

export function isWebSocketUnauthenticateMessage(
  event: AnyWebSocketQueueEventMessageWithCorrelation,
): event is WebSocketQueueClientEventMessageUnauthenticate {
  return event.type === WebSocketQueueClientMessageEventType.Unauthenticate;
}

export function* askWebSocketQueueProcessUnauthenticate(connectionId: string): AskResponse<void> {
  const connection = yield* webSocketConnectionData.askConnectionGetById(connectionId);
  if (!connection) {
    return;
  }

  // Remove the user id, access token and any claimed storage scope: an
  // unauthenticated connection must never keep stamping a tenant onto messages
  const { userId, accessToken, scope, ...connectionWithNoUserInfo } = connection;

  if (connection) {
    yield* webSocketConnectionData.askConnectionUpsert(connectionWithNoUserInfo);
  }

  yield* askWebSocketQueueSendMessage(connectionId, {
    type: WebSocketQueueServerMessageEventType.Unauthenticated,
  } satisfies WebSocketQueueServerEventMessageUnauthenticated);
}
