import { askKeyValueStoreDelete, AskResponse } from 'quidproquo-core';

import { TENANT_MEMBERSHIPS_STORE } from '../constants/tenantStoreNames';

// Remove a membership row. Idempotent - deleting a missing row is a no-op.
export function* askTenantMembershipDelete(userId: string, tenantId: string): AskResponse<void> {
  yield* askKeyValueStoreDelete(TENANT_MEMBERSHIPS_STORE, userId, tenantId);
}
