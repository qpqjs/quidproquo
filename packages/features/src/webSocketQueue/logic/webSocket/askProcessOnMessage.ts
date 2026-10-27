import { AskResponse, askStorageScopeProvide } from '@qpqjs/core';

import {
  AnyWebSocketQueueEventMessageWithCorrelation,
  WebSocketQueueServerEventMessageUnauthenticated,
  WebSocketQueueServerMessageEventType,
} from '../../types';
import { askBroadcastUnknownMessage } from './askBroadcastUnknownMessage';
import { askSendMessage } from './askSendMessage';
import { askTryAuthenticateConnection } from './askTryAuthenticateConnection';
import { askWebSocketQueueAuthenticatesConnections } from './askWebSocketQueueAuthenticatesConnections';
import {
  askProcessOnAuthenticate,
  askProcessOnPing,
  askProcessOnSubscribe,
  askProcessOnUnauthenticate,
  askProcessOnUnsubscribe,
  isWebSocketAuthenticateMessage,
  isWebSocketPingMessage,
  isWebSocketSubscribeMessage,
  isWebSocketUnauthenticateMessage,
  isWebSocketUnsubscribeMessage,
} from './messageProcessors';

export function* askProcessOnMessage(connectionId: string, message: AnyWebSocketQueueEventMessageWithCorrelation): AskResponse<void> {
  if (isWebSocketAuthenticateMessage(message)) {
    if (message.payload.accessToken) {
      return yield* askProcessOnAuthenticate(connectionId, message.payload.accessToken, message.payload.scope);
    } else {
      return yield* askProcessOnUnauthenticate(connectionId);
    }
  }

  if (isWebSocketUnauthenticateMessage(message)) {
    return yield* askProcessOnUnauthenticate(connectionId);
  }

  if (isWebSocketPingMessage(message)) {
    return yield* askProcessOnPing(connectionId);
  }

  // Make sure any messages below have access to the authenticated user
  const connection = yield* askTryAuthenticateConnection(connectionId);

  // On a queue that authenticates, nothing else goes through for a connection that has not: a subscribe
  // would be ignored anyway, and an unknown message would land on the service's event bus with no user
  // behind it, for any handler that forgets to check.
  if (!connection?.accessToken && (yield* askWebSocketQueueAuthenticatesConnections())) {
    yield* askSendMessage(connectionId, {
      type: WebSocketQueueServerMessageEventType.Unauthenticated,
    } satisfies WebSocketQueueServerEventMessageUnauthenticated);
    return;
  }

  if (isWebSocketSubscribeMessage(message)) {
    return yield* askProcessOnSubscribe(connection, message.payload.topic);
  }

  if (isWebSocketUnsubscribeMessage(message)) {
    return yield* askProcessOnUnsubscribe(connection, message.payload.topic);
  }

  // The connection's validated scope becomes the ambient storage scope for the
  // whole message - the event-bus send serializes it with the session, so queue
  // handlers (and the AI tools running on their sessions) inherit it.
  if (connection?.scope) {
    return yield* askStorageScopeProvide(connection.scope, askBroadcastUnknownMessage(message));
  }

  // Send the message to the event bus
  yield* askBroadcastUnknownMessage(message);
}
