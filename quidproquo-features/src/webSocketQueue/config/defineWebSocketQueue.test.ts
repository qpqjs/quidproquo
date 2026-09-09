import { QPQCoreConfigSettingType } from 'quidproquo-core';
import { QPQWebServerConfigSettingType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import {
  defineWebSocketQueue,
  getWebSocketQueueGlobalConfigKeyForConnectionScopeResolver,
  getWebSocketQueueGlobalConfigKeyForEventBusName,
  getWebSocketQueueGlobalConfigKeyForOnConnected,
  getWebSocketQueueGlobalConfigKeyForUserDirectoryName,
  getWebSocketQueueKeyValueStoreName,
} from './defineWebSocketQueue';

describe('webSocketQueue key helpers', () => {
  it('derives stable keys from the api name', () => {
    expect(getWebSocketQueueGlobalConfigKeyForEventBusName('chat')).toBe('qpq-wsq-eb-name-chat');
    expect(getWebSocketQueueGlobalConfigKeyForUserDirectoryName('chat')).toBe('qpq-wsq-kvs-name-chat');
    expect(getWebSocketQueueGlobalConfigKeyForConnectionScopeResolver('chat')).toBe('qpq-wsq-scope-resolver-chat');
    expect(getWebSocketQueueGlobalConfigKeyForOnConnected('chat')).toBe('qpq-wsq-on-connected-chat');
    expect(getWebSocketQueueKeyValueStoreName('chat')).toBe('qpq-wsq-chat');
  });
});

describe('defineWebSocketQueue', () => {
  it('emits four globals, a connection kvs and a websocket', () => {
    const config = defineWebSocketQueue('chat-bus', 'chat');
    const types = config.map((setting) => (setting as { configSettingType: string }).configSettingType);

    expect(types).toEqual([
      QPQCoreConfigSettingType.global,
      QPQCoreConfigSettingType.global,
      QPQCoreConfigSettingType.global,
      QPQCoreConfigSettingType.global,
      QPQCoreConfigSettingType.keyValueStore,
      QPQWebServerConfigSettingType.WebSocket,
    ]);
  });
});
