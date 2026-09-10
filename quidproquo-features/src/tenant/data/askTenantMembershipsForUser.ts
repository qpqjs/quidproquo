import { askKeyValueStoreQuery, AskResponse, kvsEqual } from 'quidproquo-core';

import { TENANT_MEMBERSHIPS_STORE } from '../constants/tenantStoreNames';
import { TenantMembership } from '../models/TenantMembership';

// Every tenant this user belongs to (disabled rows included - callers decide).
// Pages through the keyed query; a user's tenant count is small.
export function* askTenantMembershipsForUser(userId: string): AskResponse<TenantMembership[]> {
  const memberships: TenantMembership[] = [];
  let nextPageKey: string | undefined;

  do {
    const page = yield* askKeyValueStoreQuery<TenantMembership>(TENANT_MEMBERSHIPS_STORE, kvsEqual('userId', userId), { nextPageKey });
    memberships.push(...page.items);
    nextPageKey = page.nextPageKey;
  } while (nextPageKey);

  return memberships;
}
