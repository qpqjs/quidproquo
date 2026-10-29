import { AskResponse } from '@qpqjs/core';

import { askWebsocketConnectionInfoProvide } from '../../context';
import { webSocketSubscriptionData } from '../../data/subscriptionData';
import { AnyWebSocketQueueEventMessage } from '../../types/AnyWebSocketQueueEventMessage';
import { askSendToConnectionCleaningUpStale } from './askSendToConnectionCleaningUpStale';

function* askSendToSubscribers(scopedTopic: string, message: AnyWebSocketQueueEventMessage): AskResponse<void> {
  const subscriptions = yield* webSocketSubscriptionData.askGetByTopic(scopedTopic);

  for (const subscription of subscriptions) {
    yield* askSendToConnectionCleaningUpStale(subscription.connectionId, message);
  }
}

/**
 * Server-initiated push to every connection subscribed to `scopedTopic` on the named api (build the topic with
 * buildScopedWebSocketQueueTopic from the sender's own scope). Needs no websocket-triggered context, so any story can
 * call it. Dead connections are dropped from the stores as they are found.
 */
export function* askWebSocketQueueSendToTopic<E extends AnyWebSocketQueueEventMessage>(
  websocketApiName: string,
  scopedTopic: string,
  message: E,
): AskResponse<void> {
  yield* askWebsocketConnectionInfoProvide({ apiName: websocketApiName }, askSendToSubscribers(scopedTopic, message));
}
