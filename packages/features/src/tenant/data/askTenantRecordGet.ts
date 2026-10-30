import { askKeyValueStoreGet, AskResponse, Nullable } from '@qpqjs/core';

import { TENANT_RECORD_STORE } from '../constants/tenantStoreNames';
import { TenantId } from '../models/TenantId';
import { TenantRecord } from '../models/TenantRecord';

export function* askTenantRecordGet(tenantId: TenantId): AskResponse<Nullable<TenantRecord>> {
  return yield* askKeyValueStoreGet<TenantRecord>(TENANT_RECORD_STORE, tenantId);
}
