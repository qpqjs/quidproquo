import { QPQConfigSetting } from '@qpqjs/core';

import { QpqWebSocketEventProcessors } from './QpqWebSocketEventProcessors';

export type WebSocketQPQWebServerConfigSetting = {
  apiSubdomain: string;

  onRootDomain: boolean;

  apiName: string;

  eventProcessors: QpqWebSocketEventProcessors;

  deprecated: boolean;

  maxConcurrentExecutions?: number;
} & QPQConfigSetting;
