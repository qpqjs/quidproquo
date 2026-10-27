import { useWebsocketManagement } from './hooks';
import { WebSocketContext } from './WebsocketContext';

export type WebSocketContextProps = {
  children: React.ReactNode;
  wsUrl: string;
};

export const WebsocketProvider: React.FC<WebSocketContextProps> = ({ children, wsUrl }) => {
  const websocketManagement = useWebsocketManagement(wsUrl);

  return <WebSocketContext.Provider value={websocketManagement}>{children}</WebSocketContext.Provider>;
};
