import { askDateNow, AskResponse } from 'quidproquo-core';

import { askTenantMembershipGet } from '../data/askTenantMembershipGet';
import { askTenantMembershipWrite } from '../data/askTenantMembershipWrite';
import { TenantMembership } from '../models/TenantMembership';

/** Link a user to a tenant with a starting role set. Idempotent: an existing row is returned untouched, whatever it holds. */
export function* askTenantLinkMember(tenantId: string, userId: string, roles: string[], addedByUserId: string): AskResponse<TenantMembership> {
  const existing = yield* askTenantMembershipGet(userId, tenantId);
  if (existing) {
    return existing;
  }

  const joinedAt = yield* askDateNow();
  const membership: TenantMembership = {
    tenantId,
    userId,
    roles,
    grants: [],
    joinedAt,
    addedByUserId,
    rolesUpdatedAt: joinedAt,
    rolesUpdatedByUserId: addedByUserId,
  };

  yield* askTenantMembershipWrite(membership);

  return membership;
}
