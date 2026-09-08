import { QPQConfig } from 'quidproquo-core';

import { defineWebSocketQueue, QPQConfigAdvancedWebsocketQueueSettings } from '../../webSocketQueue';
import { TENANT_CONNECTION_SCOPE_RESOLVER_FN } from '../constants/tenantStoreNames';

export type QPQConfigAdvancedTenantedWebsocketQueueSettings = Omit<QPQConfigAdvancedWebsocketQueueSettings, 'connectionScopeResolver'>;

// A defineWebSocketQueue with the tenant scope resolution pre-wired as the
// connection scope resolver: a tenant claimed in the ws Authenticate
// handshake is membership-checked before it is stored, and a handshake with
// no claim is stored under the user's own personal scope - the connection is
// never left unscoped. The deploying service must still register the resolver
// implementation by calling defineTenant.
export const defineTenantedWebSocketQueue = (
  eventBusName: string,
  apiName: string,
  advancedSettings?: QPQConfigAdvancedTenantedWebsocketQueueSettings,
): QPQConfig =>
  defineWebSocketQueue(eventBusName, apiName, {
    ...advancedSettings,
    connectionScopeResolver: TENANT_CONNECTION_SCOPE_RESOLVER_FN,
  });
