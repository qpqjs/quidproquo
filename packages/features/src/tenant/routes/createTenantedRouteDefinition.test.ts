import { AskResponse, ConfigActionType, ErrorTypeEnum, KeyValueStoreActionType, runStory, UserDirectoryActionType } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { toQpqPermission } from '../../permission/logic/toQpqPermission';
import { TENANT_ADMIN_ROLE } from '../constants/tenantAdminRole';
import { DEFAULT_TENANT_HEADER_NAME, TENANT_ROLES_GLOBAL } from '../constants/tenantGlobalNames';
import { buildTenantRolesConfig } from '../logic/roles/buildTenantRolesConfig';
import { createTenantedRouteDefinition } from './createTenantedRouteDefinition';

const approve = toQpqPermission('case:approve');
const rolesConfig = buildTenantRolesConfig({ catalog: { approver: { code: 'approver', name: 'Approver', permissions: [approve] } } });

const buildEvent = (tenantId?: string): HTTPEvent =>
  ({
    path: '/cases/c1/approval',
    query: {},
    headers: tenantId ? { [DEFAULT_TENANT_HEADER_NAME]: tenantId } : {},
    method: 'POST',
    correlation: 'c',
    sourceIp: '127.0.0.1',
    isBase64Encoded: false,
  }) as HTTPEvent;

const buildMocks = (roles: string[], grants: unknown[] = []) => ({
  [ConfigActionType.GetGlobal]: (action: { payload: { globalName: string } }) =>
    action.payload.globalName === TENANT_ROLES_GLOBAL ? rolesConfig : '',
  [UserDirectoryActionType.ReadAccessToken]: { userId: 'u1' },
  [KeyValueStoreActionType.Query]: { items: [{ userId: 'u1', tenantId: 'tenant-a', roles, grants }], nextPageKey: undefined },
});

// Forbidden reaches the client as 403 through the family's common known errors, as an app would declare it.
const tenantedRoute = createTenantedRouteDefinition('app-users', {}, { [ErrorTypeEnum.Forbidden]: 403 });

function* askHandler(): AskResponse<HTTPEventResponse> {
  return qpqWebServerUtils.toJsonEventResponse({ ok: true });
}

const gated = tenantedRoute(['POST', '/cases/{id}/approval'], askHandler, { permission: { permission: approve, resourceIdParam: 'id' } });
const personalOk = tenantedRoute(['GET', '/me'], askHandler, { permission: { permission: approve, allowPersonalScope: true } });
const membershipOnly = tenantedRoute(['GET', '/cases'], askHandler);

describe('createTenantedRouteDefinition', () => {
  it('runs the handler when the member holds the declared permission', () => {
    expect(runStory(gated(buildEvent('tenant-a'), { id: 'c1' }), buildMocks(['approver'])).status).toBe(200);
    expect(
      runStory(gated(buildEvent('tenant-a'), { id: 'c1' }), buildMocks([], [{ permission: approve, selector: { kind: 'ids', ids: ['c1'] } }])).status,
    ).toBe(200);
  });

  it('refuses a member without it, including a grant scoped to a different resource', () => {
    expect(runStory(gated(buildEvent('tenant-a'), { id: 'c1' }), buildMocks([TENANT_ADMIN_ROLE])).status).toBe(403);
    expect(
      runStory(gated(buildEvent('tenant-a'), { id: 'c1' }), buildMocks([], [{ permission: approve, selector: { kind: 'ids', ids: ['c2'] } }])).status,
    ).toBe(403);
  });

  it('refuses a personal-scope request unless the route allows it', () => {
    expect(runStory(gated(buildEvent(), { id: 'c1' }), buildMocks(['approver'])).status).toBe(403);
    expect(runStory(personalOk(buildEvent(), {}), buildMocks([])).status).toBe(200);
  });

  it('a route with no permission stays membership-only', () => {
    expect(runStory(membershipOnly(buildEvent('tenant-a'), {}), buildMocks([])).status).toBe(200);
    expect(runStory(membershipOnly(buildEvent('tenant-b'), {}), buildMocks([])).status).toBe(403);
  });
});
