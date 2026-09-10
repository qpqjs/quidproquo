import { AskResponse } from 'quidproquo-core';

import { askTenantMemberLinksGet } from '../data/askTenantMemberLinksGet';
import { askTenantMemberLinksUpsert } from '../data/askTenantMemberLinksUpsert';
import { askUserTenantLinksGet } from '../data/askUserTenantLinksGet';
import { askUserTenantLinksUpsert } from '../data/askUserTenantLinksUpsert';

// Remove a user from a tenant in BOTH membership directions. Idempotent: a
// missing link is a no-op.
export function* askTenantUnlinkMember(tenantId: string, userId: string): AskResponse<void> {
  const userLinks = yield* askUserTenantLinksGet(userId);
  if (userLinks?.tenantIds.includes(tenantId)) {
    yield* askUserTenantLinksUpsert({ userId, tenantIds: userLinks.tenantIds.filter((id) => id !== tenantId) });
  }

  const memberLinks = yield* askTenantMemberLinksGet(tenantId);
  if (memberLinks?.userIds.includes(userId)) {
    yield* askTenantMemberLinksUpsert({ tenantId, userIds: memberLinks.userIds.filter((id) => id !== userId) });
  }
}
