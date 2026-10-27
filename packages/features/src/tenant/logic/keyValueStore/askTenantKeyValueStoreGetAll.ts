import { askKeyValueStoreGetAll, AskResponse } from 'quidproquo-core';

import { askActiveTenantReadOrThrow } from '../../context/askActiveTenantReadOrThrow';

export function* askTenantKeyValueStoreGetAll<Value>(keyValueStoreName: string): AskResponse<Value[]> {
  const tenantId = yield* askActiveTenantReadOrThrow();
  return yield* askKeyValueStoreGetAll<Value>(keyValueStoreName, { scope: tenantId });
}
