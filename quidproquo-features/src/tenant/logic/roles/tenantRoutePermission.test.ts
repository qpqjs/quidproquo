import { describe, expect, it } from 'vitest';

import { toQpqPermission } from '../../../permission/logic/toQpqPermission';
import { tenantRoutePermissionAllowsPersonalScope } from './tenantRoutePermissionAllowsPersonalScope';
import { tenantRoutePermissionMessage } from './tenantRoutePermissionMessage';
import { tenantRoutePermissionRequirements } from './tenantRoutePermissionRequirements';

const approve = toQpqPermission('case:approve');

describe('tenantRoutePermissionRequirements', () => {
  it('a bare key is a tenant-wide requirement', () => {
    expect(tenantRoutePermissionRequirements(approve, { id: 'c1' })).toEqual([{ permission: 'case:approve', resourceId: '', resourceKind: null }]);
  });

  it('resolves the resource id from the named path param, and a missing param to no resource', () => {
    expect(tenantRoutePermissionRequirements({ permission: approve, resourceIdParam: 'id' }, { id: 'c1' })).toEqual([
      { permission: 'case:approve', resourceId: 'c1', resourceKind: null },
    ]);
    expect(tenantRoutePermissionRequirements({ permission: approve, resourceIdParam: 'caseId' }, { id: 'c1' })).toEqual([
      { permission: 'case:approve', resourceId: '', resourceKind: null },
    ]);
  });

  it('reads the message and personal-scope opt-in off the object form only', () => {
    expect(tenantRoutePermissionMessage(approve)).toBeNull();
    expect(tenantRoutePermissionMessage({ permission: approve, message: 'No.' })).toBe('No.');
    expect(tenantRoutePermissionAllowsPersonalScope(approve)).toBe(false);
    expect(tenantRoutePermissionAllowsPersonalScope({ permission: approve, allowPersonalScope: true })).toBe(true);
  });
});
