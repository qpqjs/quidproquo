import { CrossModuleOwner, QPQConfigAdvancedSettings } from '@qpqjs/core';

export type QPQConfigAdvancedWebSocketSettings = {
  onRootDomain?: boolean;
  apiName?: string;

  // Cap (and guarantee) on this websocket api's concurrent event processing:
  // never throttled below it, never scales above it. One compute unit serves all
  // the api's event processors (connect/disconnect/message), so this bounds the
  // api as a whole. Free, but carved out of the deploy account's shared
  // concurrency pool.
  maxConcurrentExecutions?: number;

  owner?: CrossModuleOwner<'websocketApiName'>;
} & QPQConfigAdvancedSettings;
