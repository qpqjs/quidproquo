import { useAuthAccessToken, WebSocketAuthSync } from 'quidproquo-web-react';

export type WebSocketAuthProviderProps = {
  children: React.ReactNode;
};

export const WebSocketAuthProvider: React.FC<WebSocketAuthProviderProps> = ({ children }) => {
  const accessToken = useAuthAccessToken();

  // Should be able to check exp here.

  return <WebSocketAuthSync accessToken={accessToken}>{children}</WebSocketAuthSync>;
};
