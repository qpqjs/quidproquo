import { askKeyValueStoreUpsert, AskResponse } from 'quidproquo-core';

import { TENANT_EMAIL_INBOX_STORE } from '../constants/tenantEmailStoreNames';
import { TenantEmailInbox } from '../models/TenantEmailInbox';

/** Claims an address. Throws Conflict when another tenant (or this one) already holds it: addresses are global. */
export function* askTenantEmailInboxInsert(inbox: TenantEmailInbox): AskResponse<void> {
  yield* askKeyValueStoreUpsert<TenantEmailInbox>(TENANT_EMAIL_INBOX_STORE, inbox, { ifNotExists: true });
}
