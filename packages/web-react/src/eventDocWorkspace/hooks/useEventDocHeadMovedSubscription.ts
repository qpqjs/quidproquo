import { Nullable } from '@qpqjs/core';
import {
  eventDocHeadMovedTopic,
  WebSocketQueueClientEventMessageSubscribe,
  WebSocketQueueClientEventMessageUnsubscribe,
  WebSocketQueueClientMessageEventType,
  WebSocketQueueServerEventMessageAuthenticated,
  WebSocketQueueServerEventMessageEventDocHeadMoved,
  WebSocketQueueServerEventPayloadEventDocHeadMoved,
  WebSocketQueueServerMessageEventType,
} from '@qpqjs/features';

import { useEffect, useRef, useState } from 'react';

import { useSubscribeToWebSocketEvent, useWebsocketApi, useWebsocketSendEvent } from '../../websocket/hooks';
import { useWebSocketIsAuthenticated } from '../../webSocketQueue/WebSocketAuthSync/hooks/useWebSocketIsAuthenticated';

const subscribeMessage = (topic: string): WebSocketQueueClientEventMessageSubscribe => ({
  type: WebSocketQueueClientMessageEventType.Subscribe,
  payload: { topic },
});

const unsubscribeMessage = (topic: string): WebSocketQueueClientEventMessageUnsubscribe => ({
  type: WebSocketQueueClientMessageEventType.Unsubscribe,
  payload: { topic },
});

/**
 * Follows one document's head-moved pushes from a page that is not a workspace. Subscribes the queue connection to
 * the document's topic once authenticated, again on every Authenticated (the server forgets subscriptions then), and
 * calls `onHeadMoved` for each push about this document; a null `docId` follows nothing. Unsubscribes when the
 * document changes or on unmount. Needs WebsocketProvider and WebSocketAuthSync above it.
 */
export const useEventDocHeadMovedSubscription = (
  storeName: string,
  docId: Nullable<string>,
  onHeadMoved: (payload: WebSocketQueueServerEventPayloadEventDocHeadMoved) => void,
): void => {
  const websocketApi = useWebsocketApi();
  const sendEvent = useWebsocketSendEvent();
  const isAuthenticated = useWebSocketIsAuthenticated();

  // Bumped on every Authenticated message; the server forgot this connection's subscriptions at that point.
  const [authGeneration, setAuthGeneration] = useState(0);
  const subscribedTopicRef = useRef<Nullable<string>>(null);
  const onHeadMovedRef = useRef(onHeadMoved);
  onHeadMovedRef.current = onHeadMoved;

  const topic = docId ? eventDocHeadMovedTopic(storeName, docId) : null;

  useSubscribeToWebSocketEvent<WebSocketQueueServerEventMessageAuthenticated>(WebSocketQueueServerMessageEventType.Authenticated, () => {
    subscribedTopicRef.current = null;
    setAuthGeneration((generation) => generation + 1);
  });

  useSubscribeToWebSocketEvent<WebSocketQueueServerEventMessageEventDocHeadMoved>(
    WebSocketQueueServerMessageEventType.EventDocHeadMoved,
    (_websocketService, message) => {
      if (message.payload.storeName === storeName && message.payload.docId === docId) {
        onHeadMovedRef.current(message.payload);
      }
    },
  );

  useEffect(() => {
    if (!isAuthenticated || subscribedTopicRef.current === topic) {
      return;
    }

    if (subscribedTopicRef.current) {
      sendEvent(unsubscribeMessage(subscribedTopicRef.current));
    }

    if (topic) {
      sendEvent(subscribeMessage(topic));
    }

    subscribedTopicRef.current = topic;
  }, [isAuthenticated, authGeneration, topic, sendEvent]);

  useEffect(
    () => () => {
      if (subscribedTopicRef.current && websocketApi?.isConnected()) {
        sendEvent(unsubscribeMessage(subscribedTopicRef.current));
      }
    },
    [websocketApi, sendEvent],
  );
};
