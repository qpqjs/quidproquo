import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

import { TenantPermission } from '../constants/TenantPermission';
import { TenantId } from '../models/TenantId';
import { buildTenantPermissionRequirement } from './roles/buildTenantPermissionRequirement';
import { askTenantMembersWithPermission } from './askTenantMembersWithPermission';

/**
 * Refuse to take a member out of action (remove, disable, strip roles) when they are the only
 * enabled member who can assign roles: nobody could ever grant the permission back.
 */
export function* askTenantAssertNotLastAssigner(tenantId: TenantId, userId: string): AskResponse<void> {
  const assigners = yield* askTenantMembersWithPermission(tenantId, buildTenantPermissionRequirement(TenantPermission.RolesAssign));

  const isAssigner = assigners.some((membership) => membership.userId === userId);
  const othersRemain = assigners.some((membership) => membership.userId !== userId);

  if (isAssigner && !othersRemain) {
    return yield* askThrowError(ErrorTypeEnum.Conflict, 'Cannot remove the last member who can assign roles in this tenant.');
  }
}
