import { useContext } from 'react';

import { WebSocketContext } from '../WebsocketContext';

export const useWebsocketApi = () => {
  const websocketService = useContext(WebSocketContext);
  return websocketService;
};
