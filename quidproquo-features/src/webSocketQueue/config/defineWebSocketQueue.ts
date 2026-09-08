import {
  CrossModuleOwnerWithNoResourceOverride,
  defineGlobal,
  defineKeyValueStore,
  QPQConfig,
  QPQConfigAdvancedSettings,
  qpqCoreUtils,
} from 'quidproquo-core';
import { defineWebsocket } from 'quidproquo-webserver';

import { getFeatureEntryQpqFunctionRuntime } from '../../getFeatureEntryQpqFunctionRuntime';

export interface QPQConfigAdvancedWebsocketQueueSettings extends QPQConfigAdvancedSettings {
  owner?: CrossModuleOwnerWithNoResourceOverride;
  userDirectoryName?: string;

  // Registered inline-function name (see `defineInlineFunction`) invoked with
  // `{ userId, requestedScope }` on EVERY Authenticate message; returns the
  // effective storage scope to store on the connection (null = unscoped), or
  // throws to reject the authenticate. A claim with NO resolver configured is
  // rejected outright.
  connectionScopeResolver?: string;

  // Registered inline-function name (see `defineInlineFunction`) invoked with
  // `{ connectionId }` (WebSocketQueueOnConnectedInput) as soon as a connection
  // opens — BEFORE any authenticate, so only push PUBLIC state from it (e.g.
  // the admin feature pushes the active maintenance set, which pre-login
  // clients must also see). Runs in the websocket-owning service; failures are
  // swallowed so a sync problem never breaks the connect.
  onConnected?: string;
}

export function getWebSocketQueueGlobalConfigKeyForEventBusName(apiName: string): string {
  return `qpq-wsq-eb-name-${apiName}`;
}

export function getWebSocketQueueGlobalConfigKeyForUserDirectoryName(apiName: string): string {
  return `qpq-wsq-kvs-name-${apiName}`;
}

export function getWebSocketQueueGlobalConfigKeyForConnectionScopeResolver(apiName: string): string {
  return `qpq-wsq-scope-resolver-${apiName}`;
}

export function getWebSocketQueueGlobalConfigKeyForOnConnected(apiName: string): string {
  return `qpq-wsq-on-connected-${apiName}`;
}

export function getWebSocketQueueKeyValueStoreName(apiName: string): string {
  return `qpq-wsq-${apiName}`;
}

export const defineWebSocketQueue = (
  eventBusName: string,
  apiName: string,
  advancedSettings?: QPQConfigAdvancedWebsocketQueueSettings,
): QPQConfig => {
  return [
    // User defined vars (stored in config)
    defineGlobal(getWebSocketQueueGlobalConfigKeyForEventBusName(apiName), eventBusName),
    defineGlobal(getWebSocketQueueGlobalConfigKeyForUserDirectoryName(apiName), advancedSettings?.userDirectoryName || ''),
    defineGlobal(getWebSocketQueueGlobalConfigKeyForConnectionScopeResolver(apiName), advancedSettings?.connectionScopeResolver || ''),
    defineGlobal(getWebSocketQueueGlobalConfigKeyForOnConnected(apiName), advancedSettings?.onConnected || ''),

    // Store To Save Connection Info
    defineKeyValueStore(getWebSocketQueueKeyValueStoreName(apiName), 'id', undefined, {
      indexes: ['userId'],
      owner: qpqCoreUtils.convertCrossModuleOwnerToGenericResourceNameOverride(advancedSettings?.owner),
    }),

    // Actual web socket
    defineWebsocket(
      apiName,
      {
        onConnect: getFeatureEntryQpqFunctionRuntime('webSocketQueue', 'webSocket', 'onWebsocketEvent::onConnect'),
        onDisconnect: getFeatureEntryQpqFunctionRuntime('webSocketQueue', 'webSocket', 'onWebsocketEvent::onDisconnect'),
        onMessage: getFeatureEntryQpqFunctionRuntime('webSocketQueue', 'webSocket', 'onWebsocketEvent::onMessage'),
      },
      {
        apiName: apiName,
        owner: qpqCoreUtils.convertCrossModuleOwnerToGenericResourceNameOverride(advancedSettings?.owner),
      },
    ),
  ];
};
