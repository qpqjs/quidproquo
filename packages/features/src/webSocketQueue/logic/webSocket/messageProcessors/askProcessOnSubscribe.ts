import { askCatch, askConfigGetGlobal, askInlineFunctionExecute, AskResponse, Nullable } from 'quidproquo-core';

import { getWebSocketQueueGlobalConfigKeyForTopicAuthoriser } from '../../../config/defineWebSocketQueue';
import { askWebsocketReadApiNameOrThrow } from '../../../context';
import { webSocketSubscriptionData } from '../../../data/subscriptionData';
import {
  AnyWebSocketQueueEventMessageWithCorrelation,
  Connection,
  WebSocketQueueClientEventMessageSubscribe,
  WebSocketQueueClientMessageEventType,
  WebSocketQueueTopicAuthoriseInput,
} from '../../../types';
import { buildScopedWebSocketQueueTopic } from '../../topic/buildScopedWebSocketQueueTopic';

export function isWebSocketSubscribeMessage(event: AnyWebSocketQueueEventMessageWithCorrelation): event is WebSocketQueueClientEventMessageSubscribe {
  return event.type === WebSocketQueueClientMessageEventType.Subscribe;
}

// The configured authoriser throws to refuse; no authoriser means any authenticated connection may subscribe within
// its own scope.
function* askIsSubscriptionAllowed(connection: Connection, topic: string): AskResponse<boolean> {
  const apiName = yield* askWebsocketReadApiNameOrThrow();
  const topicAuthoriser = yield* askConfigGetGlobal<string>(getWebSocketQueueGlobalConfigKeyForTopicAuthoriser(apiName));

  if (!topicAuthoriser) {
    return true;
  }

  const result = yield* askCatch(
    askInlineFunctionExecute<void, WebSocketQueueTopicAuthoriseInput>(topicAuthoriser, {
      connectionId: connection.id,
      userId: connection.userId,
      scope: connection.scope,
      accessToken: connection.accessToken,
      topic,
    }),
  );

  return result.success;
}

/**
 * Files a subscription under the connection's validated scope. An unauthenticated connection, or one the topic
 * authoriser refuses, is ignored: a subscribe is fire-and-forget on the wire, and the client simply never hears pushes.
 */
export function* askProcessOnSubscribe(connection: Nullable<Connection>, topic: string): AskResponse<void> {
  if (!connection?.userId || !(yield* askIsSubscriptionAllowed(connection, topic))) {
    return;
  }

  yield* webSocketSubscriptionData.askSubscribe(buildScopedWebSocketQueueTopic(connection.scope, topic), connection.id);
}
