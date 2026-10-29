import { QPQConfigSetting } from '@qpqjs/core';

export type ApiQPQWebServerConfigSetting = {
  apiSubdomain: string;

  apiName: string;

  deprecated: boolean;

  virtualNetworkName?: string;

  maxConcurrentExecutions?: number;
} & QPQConfigSetting;
