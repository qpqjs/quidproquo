import { QPQConfigAdvancedSettings, QPQConfigSetting } from 'quidproquo-core';

import { QPQWebServerConfigSettingType } from '../QPQConfig';

export interface QPQConfigAdvancedApiSettings extends QPQConfigAdvancedSettings {
  subDomain?: string;
  cloudflareApiKeySecretName?: string;
  virtualNetworkName?: string;

  // Cap (and guarantee) on this api's concurrent requests: never throttled below
  // it, never scales above it. One compute unit serves every route on the api,
  // so this bounds the api as a whole. Free, but carved out of the deploy
  // account's shared concurrency pool.
  maxConcurrentExecutions?: number;
}

export interface ApiQPQWebServerConfigSetting extends QPQConfigSetting {
  apiSubdomain: string;

  apiName: string;

  deprecated: boolean;

  cloudflareApiKeySecretName?: string;

  virtualNetworkName?: string;

  maxConcurrentExecutions?: number;
}

export const defineApi = (apiName: string, options?: QPQConfigAdvancedApiSettings): ApiQPQWebServerConfigSetting => {
  return {
    configSettingType: QPQWebServerConfigSettingType.Api,
    uniqueKey: apiName,

    apiSubdomain: options?.subDomain || apiName,

    apiName: apiName,

    deprecated: options?.deprecated || false,

    cloudflareApiKeySecretName: options?.cloudflareApiKeySecretName,

    virtualNetworkName: options?.virtualNetworkName,

    maxConcurrentExecutions: options?.maxConcurrentExecutions,
  };
};
