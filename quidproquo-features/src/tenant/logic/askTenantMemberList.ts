import { askCatch, askMapParallel, AskResponse, askUserDirectoryGetUserAttributesByUserId } from 'quidproquo-core';

import { askTenantMemberLinksGet } from '../data/askTenantMemberLinksGet';
import { TenantMember } from '../models/TenantMember';

// The tenant's members, hydrated from the user directory (email + name). A userId
// the directory no longer knows (deleted account) still lists, with null details,
// so the admin can see and remove the stale link.
export function* askTenantMemberList(userDirectoryName: string, tenantId: string): AskResponse<TenantMember[]> {
  const links = yield* askTenantMemberLinksGet(tenantId);

  return yield* askMapParallel(links?.userIds ?? [], function* askHydrateMember(userId): AskResponse<TenantMember> {
    const { success, result } = yield* askCatch(askUserDirectoryGetUserAttributesByUserId(userDirectoryName, userId));

    return {
      userId,
      email: success ? (result.email ?? null) : null,
      name: success ? (result.name ?? null) : null,
    };
  });
}
