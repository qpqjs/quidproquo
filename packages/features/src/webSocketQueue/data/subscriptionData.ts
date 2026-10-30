import { askKeyValueStoreDelete, askKeyValueStoreQueryAll, askKeyValueStoreUpsertWithRetry, AskResponse, kvsEqual } from '@qpqjs/core';

import { getWebSocketQueueSubscriptionsKeyValueStoreName } from '../config/defineWebSocketQueue';
import { askWebsocketApiNameReadOrThrow } from '../context';
import { Subscription } from '../types/Subscription';

function* askConnectionGetStoreName(): AskResponse<string> {
  return getWebSocketQueueSubscriptionsKeyValueStoreName(yield* askWebsocketApiNameReadOrThrow());
}

function* askSubscribe(topic: string, connectionId: string): AskResponse<void> {
  const subscription: Subscription = { topic, connectionId };

  yield* askKeyValueStoreUpsertWithRetry(yield* askConnectionGetStoreName(), subscription);
}

function* askUnsubscribe(topic: string, connectionId: string): AskResponse<void> {
  yield* askKeyValueStoreDelete(yield* askConnectionGetStoreName(), topic, connectionId);
}

function* askGetByTopic(topic: string): AskResponse<Subscription[]> {
  return yield* askKeyValueStoreQueryAll<Subscription>(yield* askConnectionGetStoreName(), kvsEqual('topic', topic));
}

function* askConnectionDeleteByConnectionId(connectionId: string): AskResponse<void> {
  const storeName = yield* askConnectionGetStoreName();
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
  askConnectionDeleteByConnectionId,
};
