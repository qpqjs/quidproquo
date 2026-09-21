import { askDateNow, AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

import { TenantPermission } from '../constants/TenantPermission';
import { askTenantMembershipGet } from '../data/askTenantMembershipGet';
import { askTenantMembershipWrite } from '../data/askTenantMembershipWrite';
import { TenantId } from '../models/TenantId';
import { TenantMembership } from '../models/TenantMembership';
import { TenantPermissionGrant } from '../models/TenantPermissionGrant';
import { buildTenantPermissionRequirement } from './roles/buildTenantPermissionRequirement';
import { tenantRoleCatalogUnknownRoles } from './roles/tenantRoleCatalogUnknownRoles';
import { tenantRolesAndGrantsSatisfy } from './roles/tenantRolesAndGrantsSatisfy';
import { askTenantAssertNotLastAssigner } from './askTenantAssertNotLastAssigner';
import { askTenantMemberHasPermission } from './askTenantMemberHasPermission';
import { askTenantRolesConfigRead } from './askTenantRolesConfigRead';

/**
 * Replace a member's roles and direct grants. The actor must hold RolesAssign; role codes
 * must be in the catalog; the change may not leave the tenant with nobody who can assign.
 * Grant permission keys are opaque and not validated against anything.
 */
export function* askTenantMemberRolesSet(
  tenantId: TenantId,
  userId: string,
  roles: string[],
  grants: TenantPermissionGrant[],
  actorUserId: string,
): AskResponse<TenantMembership> {
  const assignRequirement = buildTenantPermissionRequirement(TenantPermission.RolesAssign);

  const mayAssign = yield* askTenantMemberHasPermission(tenantId, actorUserId, assignRequirement);
  if (!mayAssign) {
    return yield* askThrowError(ErrorTypeEnum.Forbidden, 'You do not have permission to assign roles in this tenant.');
  }

  const membership = yield* askTenantMembershipGet(userId, tenantId);
  if (!membership) {
    return yield* askThrowError(ErrorTypeEnum.NotFound, `User is not a member of the tenant: ${userId}`);
  }

  const catalog = yield* askTenantRolesConfigRead();
  const unknownRoles = tenantRoleCatalogUnknownRoles(catalog, roles);
  if (unknownRoles.length > 0) {
    return yield* askThrowError(ErrorTypeEnum.BadRequest, `Unknown role(s): ${unknownRoles.join(', ')}`);
  }

  if (!tenantRolesAndGrantsSatisfy(catalog, roles, grants, assignRequirement)) {
    yield* askTenantAssertNotLastAssigner(tenantId, userId);
  }

  const rolesUpdatedAt = yield* askDateNow();
  const updated: TenantMembership = { ...membership, roles, grants, rolesUpdatedAt, rolesUpdatedByUserId: actorUserId };
  yield* askTenantMembershipWrite(updated);

  return updated;
}
