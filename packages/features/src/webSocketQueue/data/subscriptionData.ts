import { askKeyValueStoreDelete, askKeyValueStoreQueryAll, askKeyValueStoreUpsertWithRetry, AskResponse, kvsEqual } from '@qpqjs/core';

import { getWebSocketQueueSubscriptionsKeyValueStoreName } from '../config/defineWebSocketQueue';
import { askWebsocketReadApiNameOrThrow } from '../context/websocketConnectionInfoContext';
import { Subscription } from '../types/Subscription';

function* askGetStoreName(): AskResponse<string> {
  return getWebSocketQueueSubscriptionsKeyValueStoreName(yield* askWebsocketReadApiNameOrThrow());
}

function* askSubscribe(topic: string, connectionId: string): AskResponse<void> {
  const subscription: Subscription = { topic, connectionId };

  yield* askKeyValueStoreUpsertWithRetry(yield* askGetStoreName(), subscription);
}

function* askUnsubscribe(topic: string, connectionId: string): AskResponse<void> {
  yield* askKeyValueStoreDelete(yield* askGetStoreName(), topic, connectionId);
}

function* askGetByTopic(topic: string): AskResponse<Subscription[]> {
  return yield* askKeyValueStoreQueryAll<Subscription>(yield* askGetStoreName(), kvsEqual('topic', topic));
}

function* askDeleteByConnectionId(connectionId: string): AskResponse<void> {
  const storeName = yield* askGetStoreName();
  const subscriptions = yield* askKeyValueStoreQueryAll<Subscription>(storeName, kvsEqual('connectionId', connectionId));

  for (const subscription of subscriptions) {
    yield* askKeyValueStoreDelete(storeName, subscription.topic, subscription.connectionId);
  }
}

/** The subscriptions store for the api in context: scoped topic to connection, both directions. */
export const webSocketSubscriptionData = {
  askSubscribe,
  askUnsubscribe,
  askGetByTopic,
  askDeleteByConnectionId,
};
