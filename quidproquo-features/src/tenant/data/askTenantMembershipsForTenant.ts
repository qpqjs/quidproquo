import { askKeyValueStoreQuery, AskResponse, kvsEqual, QpqPagedData } from 'quidproquo-core';

import { TENANT_MEMBERSHIPS_STORE } from '../constants/tenantStoreNames';
import { TenantId } from '../models/TenantId';
import { TenantMembership } from '../models/TenantMembership';

// One page of a tenant's membership rows (disabled included). Querying on tenantId
// alone routes to the tenantId GSI (eventually consistent - fine for a list; the
// access check reads the base table). Paged: a tenant may have many members.
export function* askTenantMembershipsForTenant(
  tenantId: TenantId,
  limit?: number,
  nextPageKey?: string,
): AskResponse<QpqPagedData<TenantMembership>> {
  return yield* askKeyValueStoreQuery<TenantMembership>(TENANT_MEMBERSHIPS_STORE, kvsEqual('tenantId', tenantId), { limit, nextPageKey });
}
