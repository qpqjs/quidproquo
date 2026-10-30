import { QPQConfig } from '@qpqjs/core';

import { WebSocketQPQWebServerConfigSetting } from '../types';
import { getWebsocketByName } from './getWebsocketByName';

export const resolveWebsocketOrThrow = (apiName: string, qpqConfig: QPQConfig): WebSocketQPQWebServerConfigSetting => {
  const websocket = getWebsocketByName(apiName, qpqConfig);

  if (!websocket) {
    throw new Error(`No websocket setting found for api [${apiName}]`);
  }

  return websocket;
};
