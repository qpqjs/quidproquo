import { WebsocketService } from 'quidproquo-web';

import { createContext } from 'react';

export const WebSocketContext = createContext<WebsocketService | null>(null);
