import { askKeyValueStoreUpsert, AskResponse } from 'quidproquo-core';

import { TENANT_MEMBERSHIPS_STORE } from '../constants/tenantStoreNames';
import { TenantMembership } from '../models/TenantMembership';

// Write (create or replace) a membership row.
export function* askTenantMembershipWrite(membership: TenantMembership): AskResponse<void> {
  yield* askKeyValueStoreUpsert<TenantMembership>(TENANT_MEMBERSHIPS_STORE, membership);
}
