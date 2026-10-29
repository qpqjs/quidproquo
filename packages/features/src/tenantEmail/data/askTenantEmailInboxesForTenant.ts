import { askKeyValueStoreQueryAll, AskResponse, kvsEqual } from '@qpqjs/core';

import { TenantId } from '../../tenant/models/TenantId';
import { TENANT_EMAIL_INBOX_STORE } from '../constants/tenantEmailStoreNames';
import { TenantEmailInbox } from '../models/TenantEmailInbox';

/** Every inbox a tenant holds, through the tenantId index. */
export function* askTenantEmailInboxesForTenant(tenantId: TenantId): AskResponse<TenantEmailInbox[]> {
  return yield* askKeyValueStoreQueryAll<TenantEmailInbox>(TENANT_EMAIL_INBOX_STORE, kvsEqual('tenantId', tenantId));
}
