import { useContext } from 'react';

import { WebSocketAuthContext } from '../WebSocketAuthContext';

export const useWebSocketIsAuthenticated = (): boolean => {
  return useContext(WebSocketAuthContext);
};
