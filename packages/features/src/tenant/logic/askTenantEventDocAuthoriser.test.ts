import { askStorageScopeProvide, ConfigActionType, KeyValueStoreActionType, runStory, UserDirectoryActionType } from 'quidproquo-core';
import { HTTPEvent } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { EventDocPermissionAction } from '../../eventDoc/types/EventDocPermissionAction';
import { TENANT_ROLES_GLOBAL } from '../constants/tenantGlobalNames';
import { buildTenantRolesConfig } from '../logic/roles/buildTenantRolesConfig';
import { askTenantEventDocAuthoriser } from './askTenantEventDocAuthoriser';

const rolesConfig = buildTenantRolesConfig();
const event = {} as HTTPEvent;

const buildMocks = (roles: string[]) => ({
  [ConfigActionType.GetGlobal]: (action: { payload: { globalName: string } }) =>
    action.payload.globalName === TENANT_ROLES_GLOBAL ? rolesConfig : 'users',
  [UserDirectoryActionType.ReadAccessToken]: { userId: 'u1' },
  [KeyValueStoreActionType.Query]: { items: [{ userId: 'u1', tenantId: 'tenant-a', roles, grants: [] }], nextPageKey: undefined },
});

const authorise = (scope: string, storeName: string, action: EventDocPermissionAction, roles: string[]) =>
  runStory(askStorageScopeProvide(scope, askTenantEventDocAuthoriser({ event, storeName, action })), buildMocks(roles));

describe('askTenantEventDocAuthoriser', () => {
  it('requires eventDoc:<store>:<action> inside a tenant', () => {
    expect(() => authorise('TENANT#tenant-a', 'tenants', EventDocPermissionAction.write, ['tenantAdmin'])).not.toThrow();
    expect(() => authorise('TENANT#tenant-a', 'tenants', EventDocPermissionAction.write, [])).toThrow(/eventDoc:tenants:write/);
    expect(() => authorise('TENANT#tenant-a', 'templates', EventDocPermissionAction.read, ['tenantAdmin'])).toThrow(/eventDoc:templates:read/);
  });

  it('lets a personal-scope request through', () => {
    expect(() => authorise('PERSONAL#u1', 'templates', EventDocPermissionAction.write, [])).not.toThrow();
  });
});
