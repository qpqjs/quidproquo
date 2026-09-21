import { askKeyValueStoreDelete, AskResponse } from 'quidproquo-core';

import { TENANT_EMAIL_INBOX_STORE } from '../constants/tenantEmailStoreNames';

export function* askTenantEmailInboxDelete(address: string): AskResponse<void> {
  yield* askKeyValueStoreDelete(TENANT_EMAIL_INBOX_STORE, address);
}
