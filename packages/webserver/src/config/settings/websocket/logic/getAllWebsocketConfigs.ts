import { QPQConfig, qpqCoreUtils } from '@qpqjs/core';

import { QPQWebServerConfigSettingType } from '../../../QPQConfig';
import { WebSocketQPQWebServerConfigSetting } from '../types';

export const getAllWebsocketConfigs = (qpqConfig: QPQConfig): WebSocketQPQWebServerConfigSetting[] =>
  qpqCoreUtils.getConfigSettings<WebSocketQPQWebServerConfigSetting>(qpqConfig, QPQWebServerConfigSettingType.WebSocket);
