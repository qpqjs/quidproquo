import { describe, expect, it } from 'vitest';

import { toQpqPermission } from '../../../permission/logic/toQpqPermission';
import { TENANT_ADMIN_ROLE } from '../../constants/tenantAdminRole';
import { TenantPermission } from '../../constants/TenantPermission';
import { TenantMembership } from '../../models/TenantMembership';
import { TenantRoleCatalog } from '../../models/TenantRoleCatalog';
import { toTenantId } from '../toTenantId';
import { buildTenantPermissionRequirement } from './buildTenantPermissionRequirement';
import { buildTenantRoleCatalog } from './buildTenantRoleCatalog';
import { tenantMembershipSatisfies } from './tenantMembershipSatisfies';
import { tenantRoleCatalogExpand } from './tenantRoleCatalogExpand';
import { tenantRoleCatalogUnknownRoles } from './tenantRoleCatalogUnknownRoles';

const caseRead = toQpqPermission('case:read');
const caseRecordFindings = toQpqPermission('case:recordFindings');
const caseApprove = toQpqPermission('case:approve');

const appCatalog: TenantRoleCatalog = {
  investigator: { code: 'investigator', name: 'Investigator', permissions: [caseRead, caseRecordFindings] },
  approver: { code: 'approver', name: 'Approver', permissions: [caseRead, caseApprove] },
};

const membership = (roles: string[], extra: Partial<TenantMembership> = {}): TenantMembership => ({
  tenantId: toTenantId('t1'),
  userId: 'u1',
  roles,
  grants: [],
  joinedAt: '2026-01-01T00:00:00.000Z',
  addedByUserId: 'u1',
  rolesUpdatedAt: '2026-01-01T00:00:00.000Z',
  rolesUpdatedByUserId: 'u1',
  ...extra,
});

describe('tenantRoleCatalogExpand', () => {
  it('expands to all grants, collapsing duplicates and ignoring unknown codes', () => {
    expect(tenantRoleCatalogExpand(appCatalog, ['investigator', 'approver', 'retired'])).toEqual([
      { permission: 'case:read', selector: { kind: 'all' } },
      { permission: 'case:recordFindings', selector: { kind: 'all' } },
      { permission: 'case:approve', selector: { kind: 'all' } },
    ]);
    expect(tenantRoleCatalogUnknownRoles(appCatalog, ['investigator', 'retired'])).toEqual(['retired']);
  });
});

describe('buildTenantRoleCatalog', () => {
  it('adds the built-in admin role holding the membership keys and the tenant collection', () => {
    const catalog = buildTenantRoleCatalog(appCatalog);

    expect(Object.keys(catalog).sort()).toEqual(['approver', 'investigator', TENANT_ADMIN_ROLE]);
    expect(catalog[TENANT_ADMIN_ROLE].permissions).toEqual(
      expect.arrayContaining([TenantPermission.MembersManage, TenantPermission.RolesAssign, 'eventDoc:tenants:write']),
    );
  });

  it('works with no app catalog at all', () => {
    expect(Object.keys(buildTenantRoleCatalog())).toEqual([TENANT_ADMIN_ROLE]);
  });

  it('refuses the reserved code and a code that disagrees with its key', () => {
    expect(() => buildTenantRoleCatalog({ [TENANT_ADMIN_ROLE]: { code: TENANT_ADMIN_ROLE, name: 'x', permissions: [] } })).toThrow(/reserved/);
    expect(() => buildTenantRoleCatalog({ a: { code: 'b', name: 'x', permissions: [] } })).toThrow(/different code/);
  });
});

describe('tenantMembershipSatisfies', () => {
  const catalog = buildTenantRoleCatalog(appCatalog);
  const approve = buildTenantPermissionRequirement(caseApprove);

  it('unions roles and direct grants', () => {
    expect(tenantMembershipSatisfies(catalog, membership(['approver']), approve)).toBe(true);
    expect(tenantMembershipSatisfies(catalog, membership(['investigator']), approve)).toBe(false);
    expect(
      tenantMembershipSatisfies(
        catalog,
        membership(['investigator'], { grants: [{ permission: caseApprove, selector: { kind: 'ids', ids: ['case-1'] } }] }),
        buildTenantPermissionRequirement(caseApprove, 'case-1'),
      ),
    ).toBe(true);
  });

  it('a missing or disabled membership holds nothing', () => {
    expect(tenantMembershipSatisfies(catalog, null, approve)).toBe(false);
    expect(tenantMembershipSatisfies(catalog, membership(['approver'], { disabled: true }), approve)).toBe(false);
  });

  it('the admin role manages members and assigns roles', () => {
    const admin = membership([TENANT_ADMIN_ROLE]);
    expect(tenantMembershipSatisfies(catalog, admin, buildTenantPermissionRequirement(TenantPermission.MembersManage))).toBe(true);
    expect(tenantMembershipSatisfies(catalog, admin, buildTenantPermissionRequirement(TenantPermission.RolesAssign))).toBe(true);
    expect(tenantMembershipSatisfies(catalog, admin, approve)).toBe(false);
  });
});
