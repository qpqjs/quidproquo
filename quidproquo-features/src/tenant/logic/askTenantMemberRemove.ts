import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

import { askTenantMembershipDelete } from '../data/askTenantMembershipDelete';
import { askTenantMembershipGet } from '../data/askTenantMembershipGet';
import { TenantMembershipRole } from '../models/TenantMembershipRole';

// Remove a member from a tenant. An owner is never removed (demote first): it
// would risk orphaning the tenant - nothing but a membership row can find it again.
// Idempotent - a missing row is a no-op.
export function* askTenantMemberRemove(tenantId: string, userId: string): AskResponse<void> {
  const membership = yield* askTenantMembershipGet(userId, tenantId);
  if (!membership) {
    return;
  }

  if (membership.role === TenantMembershipRole.owner) {
    return yield* askThrowError(ErrorTypeEnum.BadRequest, 'An owner cannot be removed - change their role first.');
  }

  yield* askTenantMembershipDelete(userId, tenantId);
}
