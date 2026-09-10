import { askCatch, askMapParallel, AskResponse, askUserDirectoryGetUserAttributesByUserId, QpqPagedData } from 'quidproquo-core';

import { askTenantMembershipsForTenant } from '../data/askTenantMembershipsForTenant';
import { TenantMember } from '../models/TenantMember';

// One page of the tenant's members (disabled included), hydrated from the user
// directory (email + name). A userId the directory no longer knows (deleted
// account) still lists, with null details, so an owner can see and remove the
// stale row.
export function* askTenantMemberList(
  userDirectoryName: string,
  tenantId: string,
  limit?: number,
  nextPageKey?: string,
): AskResponse<QpqPagedData<TenantMember>> {
  const page = yield* askTenantMembershipsForTenant(tenantId, limit, nextPageKey);

  const items = yield* askMapParallel(page.items, function* askHydrateMember(membership): AskResponse<TenantMember> {
    const { success, result } = yield* askCatch(askUserDirectoryGetUserAttributesByUserId(userDirectoryName, membership.userId));

    return {
      userId: membership.userId,
      email: success ? (result.email ?? null) : null,
      name: success ? (result.name ?? null) : null,
      role: membership.role,
      disabled: membership.disabled ?? false,
      joinedAt: membership.joinedAt,
    };
  });

  return { items, nextPageKey: page.nextPageKey };
}
