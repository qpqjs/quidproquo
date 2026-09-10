import { AskResponse } from 'quidproquo-core';

import { askTenantMemberLinksGet } from '../data/askTenantMemberLinksGet';
import { askTenantMemberLinksUpsert } from '../data/askTenantMemberLinksUpsert';
import { askUserTenantLinksGet } from '../data/askUserTenantLinksGet';
import { askUserTenantLinksUpsert } from '../data/askUserTenantLinksUpsert';

// Link a user to a tenant in BOTH membership directions (user -> tenants for the
// scope resolver, tenant -> users for the member list). Idempotent: an existing
// link is left as-is. Read-modify-write on both rows: no invite flow yet, so
// contention on one user's or one tenant's row is negligible.
export function* askTenantLinkMember(tenantId: string, userId: string): AskResponse<void> {
  const userLinks = yield* askUserTenantLinksGet(userId);
  const userTenantIds = userLinks?.tenantIds ?? [];
  if (!userTenantIds.includes(tenantId)) {
    yield* askUserTenantLinksUpsert({ userId, tenantIds: [...userTenantIds, tenantId] });
  }

  const memberLinks = yield* askTenantMemberLinksGet(tenantId);
  const memberUserIds = memberLinks?.userIds ?? [];
  if (!memberUserIds.includes(userId)) {
    yield* askTenantMemberLinksUpsert({ tenantId, userIds: [...memberUserIds, userId] });
  }
}
