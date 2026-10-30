import { askKeyValueStoreQueryAll, AskResponse, kvsEqual } from '@qpqjs/core';

import { TENANT_MEMBERSHIPS_STORE } from '../constants/tenantStoreNames';
import { TenantMembership } from '../models/TenantMembership';

// Every tenant this user belongs to (disabled rows included - callers decide).
// Drains the keyed query; a user's tenant count is small.
export function* askTenantMembershipsForUser(userId: string): AskResponse<TenantMembership[]> {
  return yield* askKeyValueStoreQueryAll<TenantMembership>(TENANT_MEMBERSHIPS_STORE, kvsEqual('userId', userId));
}
