import { askDateNow, AskResponse } from 'quidproquo-core';

import { askTenantMembershipGet } from '../data/askTenantMembershipGet';
import { askTenantMembershipWrite } from '../data/askTenantMembershipWrite';
import { TenantMembership } from '../models/TenantMembership';
import { TenantMembershipRole } from '../models/TenantMembershipRole';

// Link a user to a tenant with a role. Idempotent: an existing row (whatever its
// role or disabled state) is returned untouched - changing it is askTenantMemberUpdate's job.
export function* askTenantLinkMember(
  tenantId: string,
  userId: string,
  role: TenantMembershipRole,
  addedByUserId: string,
): AskResponse<TenantMembership> {
  const existing = yield* askTenantMembershipGet(userId, tenantId);
  if (existing) {
    return existing;
  }

  const joinedAt = yield* askDateNow();
  const membership: TenantMembership = { tenantId, userId, role, joinedAt, addedByUserId };

  yield* askTenantMembershipWrite(membership);

  return membership;
}
