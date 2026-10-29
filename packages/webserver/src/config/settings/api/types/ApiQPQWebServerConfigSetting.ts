import { QPQConfigSetting } from '@qpqjs/core';

export type ApiQPQWebServerConfigSetting = {
  apiSubdomain: string;

  apiName: string;

  deprecated: boolean;

  cloudflareApiKeySecretName?: string;

  virtualNetworkName?: string;

  maxConcurrentExecutions?: number;
} & QPQConfigSetting;
