import { ConfigActionType, KeyValueStoreActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { TENANT_ROLES_GLOBAL } from '../constants/tenantGlobalNames';
import { buildTenantRolesConfig } from '../logic/roles/buildTenantRolesConfig';
import { askTenantTopicAuthoriser } from './askTenantTopicAuthoriser';

const rolesConfig = buildTenantRolesConfig();

const buildMocks = (roles: string[]) => ({
  [ConfigActionType.GetGlobal]: (action: { payload: { globalName: string } }) =>
    action.payload.globalName === TENANT_ROLES_GLOBAL ? rolesConfig : '',
  [KeyValueStoreActionType.Query]: { items: [{ userId: 'u1', tenantId: 'tenant-a', roles, grants: [] }], nextPageKey: undefined },
});

const authorise = (scope: string | undefined, topic: string, roles: string[]) =>
  runStory(askTenantTopicAuthoriser({ connectionId: 'c1', userId: 'u1', scope, topic }), buildMocks(roles));

const authoriseAnonymous = (scope: string, topic: string) =>
  runStory(askTenantTopicAuthoriser({ connectionId: 'c1', scope, topic }), buildMocks(['tenantAdmin']));

describe('askTenantTopicAuthoriser', () => {
  it('requires eventDoc:<store>:read inside a tenant', () => {
    expect(() => authorise('TENANT#tenant-a', 'eventDoc#tenants#doc-1', ['tenantAdmin'])).not.toThrow();
    expect(() => authorise('TENANT#tenant-a', 'eventDoc#tenants#doc-1', [])).toThrow(/eventDoc:tenants:read/);
    expect(() => authorise('TENANT#tenant-a', 'eventDoc#templates#doc-1', ['tenantAdmin'])).toThrow(/eventDoc:templates:read/);
  });

  it('lets a personal-scope connection through', () => {
    expect(() => authorise('PERSONAL#u1', 'eventDoc#templates#doc-1', [])).not.toThrow();
  });

  it('refuses a topic it does not understand', () => {
    expect(() => authorise('TENANT#tenant-a', 'chat#room-1', ['tenantAdmin'])).toThrow(/Unknown topic/);
  });

  it('refuses an unscoped or anonymous connection', () => {
    expect(() => authorise(undefined, 'eventDoc#tenants#doc-1', ['tenantAdmin'])).toThrow(/scoped connection/);
    expect(() => authoriseAnonymous('TENANT#tenant-a', 'eventDoc#tenants#doc-1')).toThrow(/scoped connection/);
  });
});
