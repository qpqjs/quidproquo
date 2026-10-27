import { askKeyValueStoreUpsert, AskResponse } from 'quidproquo-core';

import { TENANT_RECORD_STORE } from '../constants/tenantStoreNames';
import { TenantRecord } from '../models/TenantRecord';

export function* askTenantRecordUpsert(record: TenantRecord): AskResponse<void> {
  return yield* askKeyValueStoreUpsert<TenantRecord>(TENANT_RECORD_STORE, record);
}
