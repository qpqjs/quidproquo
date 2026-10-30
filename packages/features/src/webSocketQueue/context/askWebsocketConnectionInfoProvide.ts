import { createContextProvider } from '@qpqjs/core';

import { WebsocketConnectionInfo } from '../types/WebsocketConnectionInfo';
import { websocketConnectionInfoContext } from './websocketConnectionInfoContext';

export const askWebsocketConnectionInfoProvide = createContextProvider(websocketConnectionInfoContext, (context: WebsocketConnectionInfo) => context);
