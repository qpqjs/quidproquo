import { QPQCoreConfigSettingType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getWebSocketQueueGlobalConfigKeyForConnectionScopeResolver, getWebSocketQueueGlobalConfigKeyForTopicAuthoriser } from '../../webSocketQueue';
import { TENANT_CONNECTION_SCOPE_RESOLVER_FN, TENANT_TOPIC_AUTHORISER_FN } from '../constants/tenantStoreNames';
import { defineTenantedWebSocketQueue } from './defineTenantedWebSocketQueue';

describe('defineTenantedWebSocketQueue', () => {
  it('pre-wires the tenant scope resolution as the connection scope resolver', () => {
    const config = defineTenantedWebSocketQueue('chat-bus', 'chat');

    const resolverGlobal = config.find(
      (setting) =>
        (setting as { configSettingType: string; key?: string }).configSettingType === QPQCoreConfigSettingType.global &&
        (setting as { key?: string }).key === getWebSocketQueueGlobalConfigKeyForConnectionScopeResolver('chat'),
    );

    expect(resolverGlobal).toMatchObject({ value: TENANT_CONNECTION_SCOPE_RESOLVER_FN });
  });

  it('pre-wires the tenant read check as the topic authoriser', () => {
    const config = defineTenantedWebSocketQueue('chat-bus', 'chat');

    const authoriserGlobal = config.find(
      (setting) =>
        (setting as { configSettingType: string; key?: string }).configSettingType === QPQCoreConfigSettingType.global &&
        (setting as { key?: string }).key === getWebSocketQueueGlobalConfigKeyForTopicAuthoriser('chat'),
    );

    expect(authoriserGlobal).toMatchObject({ value: TENANT_TOPIC_AUTHORISER_FN });
  });

  it('forwards the remaining advanced settings to defineWebSocketQueue', () => {
    const config = defineTenantedWebSocketQueue('chat-bus', 'chat', { userDirectoryName: 'users' });

    // Same shape as defineWebSocketQueue: five globals, the connection and subscription kvs and a websocket.
    expect(config).toHaveLength(9);
    expect(config.some((setting) => (setting as { value?: unknown }).value === 'users')).toBe(true);
  });
});
