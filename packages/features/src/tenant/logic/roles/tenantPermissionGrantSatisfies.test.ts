import { describe, expect, it } from 'vitest';

import { toQpqPermission } from '../../../permission/logic/toQpqPermission';
import { TenantPermissionGrant } from '../../models/TenantPermissionGrant';
import { buildTenantPermissionRequirement } from './buildTenantPermissionRequirement';
import { tenantPermissionGrantSatisfies } from './tenantPermissionGrantSatisfies';

const approve = toQpqPermission('case:approve');
const close = toQpqPermission('case:close');

const all: TenantPermissionGrant = { permission: approve, selector: { kind: 'all' } };
const ids: TenantPermissionGrant = { permission: approve, selector: { kind: 'ids', ids: ['case-1'] } };
const kinds: TenantPermissionGrant = { permission: approve, selector: { kind: 'resourceKinds', kinds: ['fraud'] } };

describe('tenantPermissionGrantSatisfies', () => {
  it('denies by default: no grants, or a different permission', () => {
    expect(tenantPermissionGrantSatisfies([], buildTenantPermissionRequirement(approve))).toBe(false);
    expect(tenantPermissionGrantSatisfies([all], buildTenantPermissionRequirement(close))).toBe(false);
  });

  it('an all grant covers any resource and no resource', () => {
    expect(tenantPermissionGrantSatisfies([all], buildTenantPermissionRequirement(approve))).toBe(true);
    expect(tenantPermissionGrantSatisfies([all], buildTenantPermissionRequirement(approve, 'case-9', 'fraud'))).toBe(true);
  });

  it('an empty resource id is satisfiable only by all', () => {
    expect(tenantPermissionGrantSatisfies([ids, kinds], buildTenantPermissionRequirement(approve))).toBe(false);
    expect(tenantPermissionGrantSatisfies([{ ...ids, selector: { kind: 'ids', ids: [''] } }], buildTenantPermissionRequirement(approve))).toBe(false);
  });

  it('ids matches only the resource id, resourceKinds only the kind', () => {
    expect(tenantPermissionGrantSatisfies([ids], buildTenantPermissionRequirement(approve, 'case-1'))).toBe(true);
    expect(tenantPermissionGrantSatisfies([ids], buildTenantPermissionRequirement(approve, 'case-2'))).toBe(false);
    expect(tenantPermissionGrantSatisfies([ids], buildTenantPermissionRequirement(approve, 'fraud', 'fraud'))).toBe(false);

    expect(tenantPermissionGrantSatisfies([kinds], buildTenantPermissionRequirement(approve, 'case-2', 'fraud'))).toBe(true);
    expect(tenantPermissionGrantSatisfies([kinds], buildTenantPermissionRequirement(approve, 'case-2', 'theft'))).toBe(false);
    expect(tenantPermissionGrantSatisfies([kinds], buildTenantPermissionRequirement(approve, 'fraud'))).toBe(false);
  });
});
