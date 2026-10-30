import { Nullable, QPQConfig } from '@qpqjs/core';

import { WebSocketQPQWebServerConfigSetting } from '../types';
import { getAllWebsocketConfigs } from './getAllWebsocketConfigs';

// A websocket is addressed by its api name (the `apiName` option), not its subdomain.
export const getWebsocketByName = (apiName: string, qpqConfig: QPQConfig): Nullable<WebSocketQPQWebServerConfigSetting> =>
  getAllWebsocketConfigs(qpqConfig).find((websocket) => websocket.apiName === apiName) ?? null;
