import { QPQConfig, qpqCoreUtils } from '@qpqjs/core';

import { WebSocketQPQWebServerConfigSetting } from '../types';
import { getAllWebsocketConfigs } from './getAllWebsocketConfigs';

export const getOwnedWebsocketConfigs = (qpqConfig: QPQConfig): WebSocketQPQWebServerConfigSetting[] =>
  qpqCoreUtils.getOwnedItems(getAllWebsocketConfigs(qpqConfig), qpqConfig);
