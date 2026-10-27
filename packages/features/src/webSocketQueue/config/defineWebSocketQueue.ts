import {
  CrossModuleOwnerWithNoResourceOverride,
  defineGlobal,
  defineKeyValueStore,
  QPQConfig,
  QPQConfigAdvancedSettings,
  qpqCoreUtils,
} from '@qpqjs/core';
import { defineWebsocket } from '@qpqjs/webserver';

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

  // Registered inline-function name invoked with WebSocketQueueTopicAuthoriseInput
  // on every Subscribe message; it throws to refuse. Without one, any
  // authenticated connection may subscribe to any topic within its own scope.
  topicAuthoriser?: string;

  // Registered inline-function name invoked with WebSocketQueueAuthenticateInput
  // on every Authenticate message and again on every later message, in place of
  // the user directory: it returns the principal to store on the connection
  // (WebSocketQueueAuthenticateResult) or throws to reject. The scope it returns
  // is final; connectionScopeResolver does not run. For queues whose clients
  // hold a token the owning service validates itself (a signing session, say).
  // Mutually exclusive with userDirectoryName.
  connectionAuthenticator?: string;
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

export function getWebSocketQueueGlobalConfigKeyForTopicAuthoriser(apiName: string): string {
  return `qpq-wsq-topic-authoriser-${apiName}`;
}

export function getWebSocketQueueGlobalConfigKeyForConnectionAuthenticator(apiName: string): string {
  return `qpq-wsq-authenticator-${apiName}`;
}

export function getWebSocketQueueKeyValueStoreName(apiName: string): string {
  return `qpq-wsq-${apiName}`;
}

export function getWebSocketQueueSubscriptionsKeyValueStoreName(apiName: string): string {
  return `qpq-wsq-subs-${apiName}`;
}

export const defineWebSocketQueue = (
  eventBusName: string,
  apiName: string,
  advancedSettings?: QPQConfigAdvancedWebsocketQueueSettings,
): QPQConfig => {
  if (advancedSettings?.userDirectoryName && advancedSettings?.connectionAuthenticator) {
    throw new Error(`websocket queue '${apiName}' sets both userDirectoryName and connectionAuthenticator - a connection authenticates one way.`);
  }

  return [
    // User defined vars (stored in config)
    defineGlobal(getWebSocketQueueGlobalConfigKeyForEventBusName(apiName), eventBusName),
    defineGlobal(getWebSocketQueueGlobalConfigKeyForUserDirectoryName(apiName), advancedSettings?.userDirectoryName || ''),
    defineGlobal(getWebSocketQueueGlobalConfigKeyForConnectionScopeResolver(apiName), advancedSettings?.connectionScopeResolver || ''),
    defineGlobal(getWebSocketQueueGlobalConfigKeyForOnConnected(apiName), advancedSettings?.onConnected || ''),
    defineGlobal(getWebSocketQueueGlobalConfigKeyForTopicAuthoriser(apiName), advancedSettings?.topicAuthoriser || ''),
    defineGlobal(getWebSocketQueueGlobalConfigKeyForConnectionAuthenticator(apiName), advancedSettings?.connectionAuthenticator || ''),

    // Store To Save Connection Info
    defineKeyValueStore(getWebSocketQueueKeyValueStoreName(apiName), 'id', undefined, {
      indexes: ['userId'],
      owner: qpqCoreUtils.convertCrossModuleOwnerToGenericResourceNameOverride(advancedSettings?.owner),
    }),

    // Which connections want pushes for which scoped topic; the connectionId index is for cleanup on disconnect.
    defineKeyValueStore(getWebSocketQueueSubscriptionsKeyValueStoreName(apiName), 'topic', ['connectionId'], {
      indexes: ['connectionId'],
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
