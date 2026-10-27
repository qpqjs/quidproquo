import { AuthenticationInfo } from 'quidproquo-core';

import { memo } from 'react';

import { useWebsocketAuthSync, useWebsocketPingPong } from './hooks';
import { WebSocketAuthContext } from './WebSocketAuthContext';

export type WebSocketAuthSyncProps = {
  children: React.ReactNode;
  accessToken: AuthenticationInfo['accessToken'];

  // Active storage scope (e.g. tenant id) to claim on the connection; the
  // server validates it before any scoped work runs. Null/undefined = Personal.
  activeScope?: string | null;
};

const WebSocketAuthSyncComponent: React.FC<WebSocketAuthSyncProps> = ({ children, accessToken, activeScope }) => {
  const isAuthenticated = useWebsocketAuthSync(accessToken, activeScope);

  // Keep the active websocket alive
  useWebsocketPingPong();

  return <WebSocketAuthContext.Provider value={isAuthenticated}>{children}</WebSocketAuthContext.Provider>;
};

export const WebSocketAuthSync = memo(WebSocketAuthSyncComponent);
