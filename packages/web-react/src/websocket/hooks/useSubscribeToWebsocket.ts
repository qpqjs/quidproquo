import { WebsocketServiceEvent, WebSocketServiceSubscriptionFunction } from 'quidproquo-web';

import { useEffect } from 'react';

import { useFastCallback } from '../../hooks';
import { useWebsocketApi } from './useWebsocketApi';

export const useSubscribeToWebsocket = (subscriptionType: WebsocketServiceEvent, callback: WebSocketServiceSubscriptionFunction) => {
  const stableCallback = useFastCallback(callback);
  const websocketService = useWebsocketApi();

  useEffect(() => {
    const handle = websocketService?.subscribe(subscriptionType, stableCallback);

    return () => {
      if (handle) {
        websocketService?.unsubscribe(handle);
      }
    };
  }, [websocketService, subscriptionType, stableCallback]);
};
