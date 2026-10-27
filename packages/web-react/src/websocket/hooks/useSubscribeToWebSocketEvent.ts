import { AnyEventMessage } from 'quidproquo-core';
import { WebSocketServiceEventSubscriptionFunction } from 'quidproquo-web';

import { useEffect } from 'react';

import { useFastCallback } from '../../hooks';
import { useWebsocketApi } from './useWebsocketApi';

export const useSubscribeToWebSocketEvent = <E extends AnyEventMessage>(
  subscriptionType: E['type'],
  callback: WebSocketServiceEventSubscriptionFunction<E>,
) => {
  const stableCallback = useFastCallback(callback);
  const websocketService = useWebsocketApi();

  useEffect(() => {
    const subscriptionHandle = websocketService?.subscribeToEvent(subscriptionType, stableCallback);

    return () => {
      if (subscriptionHandle) {
        websocketService?.unsubscribe(subscriptionHandle);
      }
    };
  }, [websocketService, subscriptionType, stableCallback]);
};
