import { describe, expect, it } from 'vitest';

import { toQpqPermission } from '../../permission/logic/toQpqPermission';
import { toTenantId } from '../logic/toTenantId';
import { TenantCallerMembership } from '../models/TenantCallerMembership';
import { TenantMembershipUiEffect } from './effects/TenantMembershipUiEffect';
import { createTenantHasPermissionSelector } from './selectors/createTenantHasPermissionSelector';
import { selectTenantMembershipPermissions } from './selectors/selectTenantMembershipPermissions';
import { createInitialTenantMembershipUiState } from './types/TenantMembershipUiState';
import { tenantMembershipUiReducer } from './tenantMembershipUiReducer';

const approve = toQpqPermission('case:approve');
const tenantId = toTenantId('tenant-a');

const membership: TenantCallerMembership = {
  tenantId,
  userId: 'u1',
  roles: ['approver'],
  grants: [{ permission: approve, selector: { kind: 'ids', ids: ['case-1'] } }],
  joinedAt: '2026-01-01T00:00:00.000Z',
  addedByUserId: 'u1',
  rolesUpdatedAt: '2026-01-01T00:00:00.000Z',
  rolesUpdatedByUserId: 'u1',
  permissions: [approve],
  effectiveGrants: [{ permission: approve, selector: { kind: 'ids', ids: ['case-1'] } }],
};

describe('tenantMembershipUiReducer', () => {
  it('stores the standing, and reset clears it', () => {
    const [loaded] = tenantMembershipUiReducer(createInitialTenantMembershipUiState(), {
      type: TenantMembershipUiEffect.SetMembership,
      payload: { tenantId, membership },
    });
    expect(loaded.tenantId).toBe(tenantId);
    expect(selectTenantMembershipPermissions(loaded)).toEqual([approve]);

    const [cleared] = tenantMembershipUiReducer(loaded, { type: TenantMembershipUiEffect.Reset, payload: undefined });
    expect(cleared).toEqual(createInitialTenantMembershipUiState());
  });

  it('judges permissions over the effective grants, so a resource-scoped grant only opens its resource', () => {
    const [state] = tenantMembershipUiReducer(createInitialTenantMembershipUiState(), {
      type: TenantMembershipUiEffect.SetMembership,
      payload: { tenantId, membership },
    });

    expect(createTenantHasPermissionSelector(approve, 'case-1')(state)).toBe(true);
    expect(createTenantHasPermissionSelector(approve, 'case-2')(state)).toBe(false);
    expect(createTenantHasPermissionSelector(approve)(state)).toBe(false);
    expect(createTenantHasPermissionSelector(approve, 'case-1')(createInitialTenantMembershipUiState())).toBe(false);
  });
});
