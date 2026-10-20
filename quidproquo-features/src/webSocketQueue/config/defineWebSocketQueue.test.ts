import { QPQCoreConfigSettingType } from 'quidproquo-core';
import { QPQWebServerConfigSettingType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import {
  defineWebSocketQueue,
  getWebSocketQueueGlobalConfigKeyForConnectionAuthenticator,
  getWebSocketQueueGlobalConfigKeyForConnectionScopeResolver,
  getWebSocketQueueGlobalConfigKeyForEventBusName,
  getWebSocketQueueGlobalConfigKeyForOnConnected,
  getWebSocketQueueGlobalConfigKeyForTopicAuthoriser,
  getWebSocketQueueGlobalConfigKeyForUserDirectoryName,
  getWebSocketQueueKeyValueStoreName,
  getWebSocketQueueSubscriptionsKeyValueStoreName,
} from './defineWebSocketQueue';

describe('webSocketQueue key helpers', () => {
  it('derives stable keys from the api name', () => {
    expect(getWebSocketQueueGlobalConfigKeyForEventBusName('chat')).toBe('qpq-wsq-eb-name-chat');
    expect(getWebSocketQueueGlobalConfigKeyForUserDirectoryName('chat')).toBe('qpq-wsq-kvs-name-chat');
    expect(getWebSocketQueueGlobalConfigKeyForConnectionScopeResolver('chat')).toBe('qpq-wsq-scope-resolver-chat');
    expect(getWebSocketQueueGlobalConfigKeyForOnConnected('chat')).toBe('qpq-wsq-on-connected-chat');
    expect(getWebSocketQueueGlobalConfigKeyForTopicAuthoriser('chat')).toBe('qpq-wsq-topic-authoriser-chat');
    expect(getWebSocketQueueGlobalConfigKeyForConnectionAuthenticator('chat')).toBe('qpq-wsq-authenticator-chat');
    expect(getWebSocketQueueKeyValueStoreName('chat')).toBe('qpq-wsq-chat');
    expect(getWebSocketQueueSubscriptionsKeyValueStoreName('chat')).toBe('qpq-wsq-subs-chat');
  });
});

describe('defineWebSocketQueue', () => {
  it('emits six globals, the connection and subscription kvs and a websocket', () => {
    const config = defineWebSocketQueue('chat-bus', 'chat');
    const types = config.map((setting) => (setting as { configSettingType: string }).configSettingType);

    expect(types).toEqual([
      QPQCoreConfigSettingType.global,
      QPQCoreConfigSettingType.global,
      QPQCoreConfigSettingType.global,
      QPQCoreConfigSettingType.global,
      QPQCoreConfigSettingType.global,
      QPQCoreConfigSettingType.global,
      QPQCoreConfigSettingType.keyValueStore,
      QPQCoreConfigSettingType.keyValueStore,
      QPQWebServerConfigSettingType.WebSocket,
    ]);
  });

  it('refuses a queue that authenticates both ways', () => {
    const both = () => defineWebSocketQueue('chat-bus', 'chat', { userDirectoryName: 'users', connectionAuthenticator: 'authenticateChat' });

    expect(both).toThrow('one way');
  });
});
