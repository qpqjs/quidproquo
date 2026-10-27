import { TenantPermissionRequirement } from '../../models/TenantPermissionRequirement';
import { TenantRoutePermission } from '../../models/TenantRoutePermission';
import { buildTenantPermissionRequirement } from './buildTenantPermissionRequirement';

/**
 * Normalise a route's declaration into the requirements the check evaluates (the caller
 * passes if any one is satisfied). A declared-but-missing path param resolves to '', which
 * only an `all` grant satisfies, so a typo'd param name can only make the gate stricter.
 */
export const tenantRoutePermissionRequirements = (
  routePermission: TenantRoutePermission,
  params: Record<string, string>,
): TenantPermissionRequirement[] => {
  if (typeof routePermission === 'string') {
    return [buildTenantPermissionRequirement(routePermission)];
  }

  const resourceId = routePermission.resourceIdParam ? (params[routePermission.resourceIdParam] ?? '') : '';

  return [buildTenantPermissionRequirement(routePermission.permission, resourceId)];
};
