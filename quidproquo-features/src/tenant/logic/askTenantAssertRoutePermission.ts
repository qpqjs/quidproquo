import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

import { TenantResolvedRequest } from '../models/TenantResolvedRequest';
import { TenantRoutePermission } from '../models/TenantRoutePermission';
import { tenantMembershipSatisfies } from './roles/tenantMembershipSatisfies';
import { tenantRoutePermissionAllowsPersonalScope } from './roles/tenantRoutePermissionAllowsPersonalScope';
import { tenantRoutePermissionMessage } from './roles/tenantRoutePermissionMessage';
import { tenantRoutePermissionRequirements } from './roles/tenantRoutePermissionRequirements';
import { askTenantRolesConfigRead } from './askTenantRolesConfigRead';

/**
 * The route-level check, against the membership row the gate already read. A personal-scope
 * request cannot be evaluated and is refused unless the declaration allows it.
 */
export function* askTenantAssertRoutePermission(
  routePermission: TenantRoutePermission,
  params: Record<string, string>,
  request: TenantResolvedRequest,
): AskResponse<void> {
  if (!request.tenantId) {
    if (tenantRoutePermissionAllowsPersonalScope(routePermission)) {
      return;
    }

    return yield* askThrowError(ErrorTypeEnum.Forbidden, 'This operation requires an active tenant.');
  }

  const catalog = yield* askTenantRolesConfigRead();
  const requirements = tenantRoutePermissionRequirements(routePermission, params);

  if (requirements.some((requirement) => tenantMembershipSatisfies(catalog, request.membership, requirement))) {
    return;
  }

  const message = tenantRoutePermissionMessage(routePermission) ?? `Missing permission: ${requirements[0].permission}`;
  return yield* askThrowError(ErrorTypeEnum.Forbidden, message);
}
