import { askKeyValueStoreQuery, AskResponse, kvsAnd, kvsEqual, Nullable } from 'quidproquo-core';

import { TENANT_MEMBERSHIPS_STORE } from '../constants/tenantStoreNames';
import { TenantMembership } from '../models/TenantMembership';

// The membership row for one (user, tenant) pair - the access check. A keyed query
// on pk + sk (naming the primary sort key keeps it on the base table, never the
// GSI): the Get action has no sort-key parameter. The returned row is re-checked against the pair so a store that
// answers loosely can never grant a different tenant's membership.
export function* askTenantMembershipGet(userId: string, tenantId: string): AskResponse<Nullable<TenantMembership>> {
  const page = yield* askKeyValueStoreQuery<TenantMembership>(
    TENANT_MEMBERSHIPS_STORE,
    kvsAnd([kvsEqual('userId', userId), kvsEqual('tenantId', tenantId)]),
    { limit: 1 },
  );

  const row = page.items[0];
  return row && row.userId === userId && row.tenantId === tenantId ? row : null;
}
