import { AskResponse } from 'quidproquo-core';

import { askTenantMembershipDelete } from '../data/askTenantMembershipDelete';
import { askTenantMembershipGet } from '../data/askTenantMembershipGet';
import { TenantId } from '../models/TenantId';
import { askTenantAssertNotLastAssigner } from './askTenantAssertNotLastAssigner';

/** Remove a member, and their authority with them. The last assigner is never removed. Idempotent - a missing row is a no-op. */
export function* askTenantMemberRemove(tenantId: TenantId, userId: string): AskResponse<void> {
  const membership = yield* askTenantMembershipGet(userId, tenantId);
  if (!membership) {
    return;
  }

  yield* askTenantAssertNotLastAssigner(tenantId, userId);

  yield* askTenantMembershipDelete(userId, tenantId);
}
