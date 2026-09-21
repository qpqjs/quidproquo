import { AskResponse } from 'quidproquo-core';

import { TenantClientTarget } from '../../models/TenantClientTarget';
import { TenantId } from '../../models/TenantId';
import { TenantMemberRolesSetRequest } from '../../models/TenantMemberRolesSetRequest';
import { TenantMembership } from '../../models/TenantMembership';
import { askTenantApiRequest } from './askTenantApiRequest';

/** PUT myTenants/{id}/members/{userId}/roles: replace a member's roles and grants. */
export function* askTenantMemberRolesPut(
  target: TenantClientTarget,
  tenantId: TenantId,
  userId: string,
  assignment: TenantMemberRolesSetRequest,
): AskResponse<TenantMembership> {
  return yield* askTenantApiRequest<TenantMemberRolesSetRequest, TenantMembership>(target, 'PUT', `/${tenantId}/members/${userId}/roles`, assignment);
}
