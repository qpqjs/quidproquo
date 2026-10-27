import { AuthenticationInfo } from 'quidproquo-core';
import {
  WebSocketQueueClientEventMessageAuthenticate,
  WebSocketQueueClientEventMessageUnauthenticate,
  WebSocketQueueClientMessageEventType,
  WebSocketQueueServerEventMessageAuthenticated,
  WebSocketQueueServerEventMessageUnauthenticated,
  WebSocketQueueServerMessageEventType,
} from 'quidproquo-features';
import { WebsocketServiceEvent } from 'quidproquo-web';

import { useEffect, useState } from 'react';

import { useFastCallback } from '../../../hooks';
import { useSubscribeToWebsocket, useSubscribeToWebSocketEvent, useWebsocketApi, useWebsocketSendEvent } from '../../../websocket/hooks';

export const useWebsocketAuthSync = (accessToken: AuthenticationInfo['accessToken'], activeScope?: string | null) => {
  const sendMessage = useWebsocketSendEvent();
  const websocketApi = useWebsocketApi();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const updateAuthTokens = useFastCallback(() => {
    if (!websocketApi?.isConnected()) {
      return;
    }

    if (accessToken) {
      sendMessage({
        type: WebSocketQueueClientMessageEventType.Authenticate,
        payload: {
          accessToken: accessToken,
          scope: activeScope || undefined,
        },
      } satisfies WebSocketQueueClientEventMessageAuthenticate);
    } else if (isAuthenticated) {
      sendMessage({
        type: WebSocketQueueClientMessageEventType.Unauthenticate,
      } satisfies WebSocketQueueClientEventMessageUnauthenticate);
    }
  });

  useSubscribeToWebSocketEvent<WebSocketQueueServerEventMessageAuthenticated>(WebSocketQueueServerMessageEventType.Authenticated, () =>
    setIsAuthenticated(true),
  );
  useSubscribeToWebSocketEvent<WebSocketQueueServerEventMessageUnauthenticated>(WebSocketQueueServerMessageEventType.Unauthenticated, () =>
    setIsAuthenticated(false),
  );

  // Sync the tokens in on open
  useSubscribeToWebsocket(WebsocketServiceEvent.OPEN, updateAuthTokens);
  useSubscribeToWebsocket(WebsocketServiceEvent.CLOSE, () => setIsAuthenticated(false));

  // Sync the tokens when they change (a tenant change re-authenticates, which
  // the server treats as a fresh scope claim)
  useEffect(updateAuthTokens, [updateAuthTokens, accessToken, activeScope, websocketApi, isAuthenticated]);

  return isAuthenticated;
};
