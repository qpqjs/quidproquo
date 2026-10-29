import { AskResponse, Nullable } from '@qpqjs/core';

import { webSocketSubscriptionData } from '../../../data/subscriptionData';
import {
  AnyWebSocketQueueEventMessageWithCorrelation,
  Connection,
  WebSocketQueueClientEventMessageUnsubscribe,
  WebSocketQueueClientMessageEventType,
} from '../../../types';
import { buildScopedWebSocketQueueTopic } from '../../topic/buildScopedWebSocketQueueTopic';

export function isWebSocketUnsubscribeMessage(
  event: AnyWebSocketQueueEventMessageWithCorrelation,
): event is WebSocketQueueClientEventMessageUnsubscribe {
  return event.type === WebSocketQueueClientMessageEventType.Unsubscribe;
}

/** Removes the connection's subscription to the topic under its own scope; nothing to do for an unknown connection. */
export function* askWebSocketQueueProcessUnsubscribe(connection: Nullable<Connection>, topic: string): AskResponse<void> {
  if (!connection) {
    return;
  }

  yield* webSocketSubscriptionData.askUnsubscribe(buildScopedWebSocketQueueTopic(connection.scope, topic), connection.id);
}
