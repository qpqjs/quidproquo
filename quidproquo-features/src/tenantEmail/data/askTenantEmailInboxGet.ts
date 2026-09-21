import { askKeyValueStoreGet, AskResponse, Nullable } from 'quidproquo-core';

import { TENANT_EMAIL_INBOX_STORE } from '../constants/tenantEmailStoreNames';
import { TenantEmailInbox } from '../models/TenantEmailInbox';

/** The routing row for a local part, or null. Unscoped: this is the cross-tenant read that names a tenant. */
export function* askTenantEmailInboxGet(address: string): AskResponse<Nullable<TenantEmailInbox>> {
  return yield* askKeyValueStoreGet<TenantEmailInbox>(TENANT_EMAIL_INBOX_STORE, address);
}
