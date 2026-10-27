import { AskResponse } from 'quidproquo-core';

import { askTenantMembershipGet } from '../data/askTenantMembershipGet';
import { TenantId } from '../models/TenantId';

// Whether the user may act inside the tenant: a membership row exists and is not
// disabled. THE access check - the request scope resolver, the websocket scope
// resolver and the tenant routes all gate through here.
export function* askTenantValidateMembership(userId: string, tenantId: TenantId): AskResponse<boolean> {
  const membership = yield* askTenantMembershipGet(userId, tenantId);
  return membership !== null && !membership.disabled;
}
