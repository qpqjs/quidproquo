import { qpqCoreUtils } from '@qpqjs/core';

import { QPQWebServerConfigSettingType } from '../../QPQConfig';
import { QPQConfigAdvancedWebSocketSettings, QpqWebSocketEventProcessors, WebSocketQPQWebServerConfigSetting } from './types';

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
