import {
  eventDocHeadMovedTopic,
  EventDocWorkspaceState,
  getSlotKeyForDocument,
  WebSocketQueueClientEventMessageSubscribe,
  WebSocketQueueClientEventMessageUnsubscribe,
  WebSocketQueueClientMessageEventType,
  WebSocketQueueServerEventMessageAuthenticated,
  WebSocketQueueServerEventMessageEventDocHeadMoved,
  WebSocketQueueServerMessageEventType,
} from '@qpqjs/features';

import { useEffect, useMemo, useRef, useState } from 'react';

import { useSubscribeToWebSocketEvent, useWebsocketApi, useWebsocketSendEvent } from '../../websocket/hooks';
import { useWebSocketIsAuthenticated } from '../../webSocketQueue/WebSocketAuthSync/hooks/useWebSocketIsAuthenticated';
import { EventDocWorkspaceSyncApi } from '../types/EventDocWorkspaceSyncApi';

const subscribeMessage = (topic: string): WebSocketQueueClientEventMessageSubscribe => ({
  type: WebSocketQueueClientMessageEventType.Subscribe,
  payload: { topic },
});

const unsubscribeMessage = (topic: string): WebSocketQueueClientEventMessageUnsubscribe => ({
  type: WebSocketQueueClientMessageEventType.Unsubscribe,
  payload: { topic },
});

/**
 * Keeps a mounted workspace's document slots in step with other writers. For every slot in `storeNames` with a bound
 * identity it subscribes the queue connection to the document's head-moved topic, and answers each push with
 * `api.syncHeadMoved`. Subscriptions live on the server connection, so every Authenticated (first open, reconnect,
 * tenant switch) subscribes again; after a re-authentication each slot is also tail-pulled to cover pushes missed
 * while away. Unsubscribes on unmount. Needs WebsocketProvider and WebSocketAuthSync above it.
 */
export const useEventDocWorkspaceSync = (storeNames: Record<string, string>, state: EventDocWorkspaceState, api: EventDocWorkspaceSyncApi): void => {
  const websocketApi = useWebsocketApi();
  const sendEvent = useWebsocketSendEvent();
  const isAuthenticated = useWebSocketIsAuthenticated();

  // Bumped on every Authenticated message; the server forgot this connection's subscriptions at that point.
  const [authGeneration, setAuthGeneration] = useState(0);
  const handledGenerationRef = useRef(0);
  const subscribedRef = useRef<Map<string, string>>(new Map());

  const topics = useMemo(
    () =>
      Object.entries(storeNames).flatMap(([slotKey, storeName]): [string, string][] => {
        const docId = state.slots[slotKey]?.documentIdentity?.id;
        return docId ? [[slotKey, eventDocHeadMovedTopic(storeName, docId)]] : [];
      }),
    [storeNames, state.slots],
  );
  const topicsKey = topics.map(([slotKey, topic]) => `${slotKey}=${topic}`).join('|');

  useSubscribeToWebSocketEvent<WebSocketQueueServerEventMessageAuthenticated>(WebSocketQueueServerMessageEventType.Authenticated, () => {
    subscribedRef.current.clear();
    setAuthGeneration((generation) => generation + 1);
  });

  useSubscribeToWebSocketEvent<WebSocketQueueServerEventMessageEventDocHeadMoved>(
    WebSocketQueueServerMessageEventType.EventDocHeadMoved,
    (_websocketService, message) => {
      const { storeName, docId, headEventId, clientMessageId } = message.payload;
      const slotKey = getSlotKeyForDocument(state, storeNames, storeName, docId);

      if (slotKey) {
        api.syncHeadMoved(slotKey, headEventId, clientMessageId);
      }
    },
  );

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const wanted = new Map(topics);
    const subscribed = subscribedRef.current;
    const isReconnect = authGeneration !== handledGenerationRef.current;
    handledGenerationRef.current = authGeneration;

    for (const [slotKey, topic] of [...subscribed]) {
      if (wanted.get(slotKey) !== topic) {
        sendEvent(unsubscribeMessage(topic));
        subscribed.delete(slotKey);
      }
    }

    for (const [slotKey, topic] of wanted) {
      if (subscribed.get(slotKey) === topic) {
        continue;
      }

      sendEvent(subscribeMessage(topic));
      subscribed.set(slotKey, topic);

      // A slot still loading has no head to tail from; its bootstrap is in flight and lands current.
      if (isReconnect && !state.slots[slotKey]?.isLoading) {
        api.refresh(slotKey);
      }
    }
    // Keyed on the string so a slot state change that leaves the topics alone does not re-run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authGeneration, topicsKey, sendEvent]);

  useEffect(
    () => () => {
      if (!websocketApi?.isConnected()) {
        return;
      }

      for (const topic of subscribedRef.current.values()) {
        sendEvent(unsubscribeMessage(topic));
      }
    },
    [websocketApi, sendEvent],
  );
};
