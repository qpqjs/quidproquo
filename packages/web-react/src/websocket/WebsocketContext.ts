import { Nullable } from '@qpqjs/core';
import { WebsocketService } from '@qpqjs/web';

import { createContext } from 'react';

export const WebSocketContext = createContext<Nullable<WebsocketService>>(null);
