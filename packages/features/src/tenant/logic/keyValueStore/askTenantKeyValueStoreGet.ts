import { askKeyValueStoreGet, AskResponse } from 'quidproquo-core';

import { askActiveTenantReadOrThrow } from '../../context/askActiveTenantReadOrThrow';

export function* askTenantKeyValueStoreGet<Value>(keyValueStoreName: string, key: string): AskResponse<Value | null> {
  const tenantId = yield* askActiveTenantReadOrThrow();
  return yield* askKeyValueStoreGet<Value>(keyValueStoreName, key, { scope: tenantId });
}
