import { QPQConfigAdvancedSettings } from '@qpqjs/core';

export type QPQConfigAdvancedApiSettings = {
  subDomain?: string;
  virtualNetworkName?: string;

  // Cap (and guarantee) on this api's concurrent requests: never throttled below
  // it, never scales above it. One compute unit serves every route on the api,
  // so this bounds the api as a whole. Free, but carved out of the deploy
  // account's shared concurrency pool.
  maxConcurrentExecutions?: number;
} & QPQConfigAdvancedSettings;
