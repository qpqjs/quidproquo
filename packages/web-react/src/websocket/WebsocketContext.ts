import { WebsocketService } from '@qpqjs/web';

import { createContext } from 'react';

export const WebSocketContext = createContext<WebsocketService | null>(null);
