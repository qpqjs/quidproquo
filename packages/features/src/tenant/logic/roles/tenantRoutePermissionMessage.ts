import { Nullable } from 'quidproquo-core';

import { TenantRoutePermission } from '../../models/TenantRoutePermission';

/** The route's own refusal sentence, or null to keep the mechanism's default. */
export const tenantRoutePermissionMessage = (routePermission: TenantRoutePermission): Nullable<string> =>
  typeof routePermission === 'string' ? null : (routePermission.message ?? null);
