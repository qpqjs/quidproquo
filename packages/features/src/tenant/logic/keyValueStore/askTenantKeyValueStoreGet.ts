import { askKeyValueStoreGet, AskResponse, Nullable } from '@qpqjs/core';

import { askActiveTenantReadOrThrow } from '../../context/askActiveTenantReadOrThrow';

export function* askTenantKeyValueStoreGet<Value>(keyValueStoreName: string, key: string): AskResponse<Nullable<Value>> {
  const tenantId = yield* askActiveTenantReadOrThrow();
  return yield* askKeyValueStoreGet<Value>(keyValueStoreName, key, { scope: tenantId });
}
