import { createContextReader } from '@qpqjs/core';

import { websocketConnectionInfoContext } from './websocketConnectionInfoContext';

export const askWebsocketConnectionInfoRead = createContextReader(websocketConnectionInfoContext);
