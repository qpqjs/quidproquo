import { askKeyValueStoreQuery, AskResponse, kvsEqual } from 'quidproquo-core';

import { TenantId } from '../../tenant/models/TenantId';
import { TENANT_EMAIL_INBOX_STORE } from '../constants/tenantEmailStoreNames';
import { TenantEmailInbox } from '../models/TenantEmailInbox';

/** Every inbox a tenant holds, through the tenantId index. */
export function* askTenantEmailInboxesForTenant(tenantId: TenantId): AskResponse<TenantEmailInbox[]> {
  const inboxes: TenantEmailInbox[] = [];
  let nextPageKey: string | undefined;

  do {
    const page = yield* askKeyValueStoreQuery<TenantEmailInbox>(TENANT_EMAIL_INBOX_STORE, kvsEqual('tenantId', tenantId), { nextPageKey });
    inboxes.push(...page.items);
    nextPageKey = page.nextPageKey;
  } while (nextPageKey);

  return inboxes;
}
