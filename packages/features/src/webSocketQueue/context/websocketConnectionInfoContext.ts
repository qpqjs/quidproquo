import { createContextIdentifier } from '@qpqjs/core';

import { WebsocketConnectionInfo } from '../types/WebsocketConnectionInfo';

const websocketConnectionInfoContextDefaultValue: WebsocketConnectionInfo = {};

/** The websocket connection a story is handling, provided by the websocket queue entry points. Empty outside one. */
export const websocketConnectionInfoContext = createContextIdentifier('qpq-websocket-connection-info', websocketConnectionInfoContextDefaultValue);
