import { CrossModuleOwner, QPQConfigAdvancedSettings, QPQConfigSetting, qpqCoreUtils, QpqFunctionRuntime } from '@qpqjs/core';

import { QPQWebServerConfigSettingType } from '../QPQConfig';

export type QpqWebSocketEventProcessors = {
  onConnect?: QpqFunctionRuntime;
  onDisconnect?: QpqFunctionRuntime;
  onMessage?: QpqFunctionRuntime;

  // [type: string]: QpqSourceEntry;
};

export type QPQConfigAdvancedWebSocketSettings = {
  onRootDomain?: boolean;
  apiName?: string;

  cloudflareApiKeySecretName?: string;

  // Cap (and guarantee) on this websocket api's concurrent event processing:
  // never throttled below it, never scales above it. One compute unit serves all
  // the api's event processors (connect/disconnect/message), so this bounds the
  // api as a whole. Free, but carved out of the deploy account's shared
  // concurrency pool.
  maxConcurrentExecutions?: number;

  owner?: CrossModuleOwner<'websocketApiName'>;
} & QPQConfigAdvancedSettings;

export type WebSocketQPQWebServerConfigSetting = {
  apiSubdomain: string;

  onRootDomain: boolean;

  apiName: string;

  eventProcessors: QpqWebSocketEventProcessors;

  deprecated: boolean;

  cloudflareApiKeySecretName?: string;

  maxConcurrentExecutions?: number;
} & QPQConfigSetting;

export const defineWebsocket = (
  apiSubdomain: string,
  eventProcessors: QpqWebSocketEventProcessors,
  options?: QPQConfigAdvancedWebSocketSettings,
): WebSocketQPQWebServerConfigSetting => {
  return {
    configSettingType: QPQWebServerConfigSettingType.WebSocket,
    // uniqueKey is the CloudFormation logical id; physical names come from app/service/env
    // only, so the key must not carry anything (like a domain) that can change independently.
    uniqueKey: apiSubdomain,

    apiSubdomain,

    eventProcessors,

    // advanced
    onRootDomain: options?.onRootDomain ?? false,
    apiName: options?.apiName ?? 'api',

    deprecated: options?.deprecated ?? false,

    cloudflareApiKeySecretName: options?.cloudflareApiKeySecretName,

    maxConcurrentExecutions: options?.maxConcurrentExecutions,

    owner: qpqCoreUtils.convertCrossModuleOwnerToGenericResourceNameOverride(options?.owner),
  };
};
