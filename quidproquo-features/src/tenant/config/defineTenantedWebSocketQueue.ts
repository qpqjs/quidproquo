import { QPQConfig } from 'quidproquo-core';

import { defineWebSocketQueue, QPQConfigAdvancedWebsocketQueueSettings } from '../../webSocketQueue';
import { TENANT_CONNECTION_SCOPE_RESOLVER_FN, TENANT_TOPIC_AUTHORISER_FN } from '../constants/tenantStoreNames';

export type QPQConfigAdvancedTenantedWebsocketQueueSettings = Omit<
  QPQConfigAdvancedWebsocketQueueSettings,
  'connectionScopeResolver' | 'topicAuthoriser'
>;

// A defineWebSocketQueue with the tenant scope resolution pre-wired as the
// connection scope resolver: a tenant claimed in the ws Authenticate
// handshake is membership-checked before it is stored, and a handshake with
// no claim is stored under the user's own personal scope - the connection is
// never left unscoped. Topic subscriptions are gated the same way a read is:
// a document's head-moved topic needs eventDoc:<store>:read in the tenant. The
// deploying service must still register both implementations by calling
// defineTenant.
export const defineTenantedWebSocketQueue = (
  eventBusName: string,
  apiName: string,
  advancedSettings?: QPQConfigAdvancedTenantedWebsocketQueueSettings,
): QPQConfig =>
  defineWebSocketQueue(eventBusName, apiName, {
    ...advancedSettings,
    connectionScopeResolver: TENANT_CONNECTION_SCOPE_RESOLVER_FN,
    topicAuthoriser: TENANT_TOPIC_AUTHORISER_FN,
  });
