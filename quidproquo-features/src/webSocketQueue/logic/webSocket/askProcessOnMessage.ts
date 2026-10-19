import { AskResponse, askStorageScopeProvide } from 'quidproquo-core';

import { AnyWebSocketQueueEventMessageWithCorrelation } from '../../types';
import { askBroadcastUnknownMessage } from './askBroadcastUnknownMessage';
import { askTryAuthenticateConnection } from './askTryAuthenticateConnection';
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
