import { TenantRoutePermission } from '../../models/TenantRoutePermission';

/** May this route run ungated with no tenant header? False unless the declaration says so. */
export const tenantRoutePermissionAllowsPersonalScope = (routePermission: TenantRoutePermission): boolean =>
  typeof routePermission !== 'string' && !!routePermission.allowPersonalScope;
