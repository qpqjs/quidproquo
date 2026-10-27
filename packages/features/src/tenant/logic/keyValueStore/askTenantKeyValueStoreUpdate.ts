import { askKeyValueStoreUpdate, AskResponse, KvsCoreDataType, KvsUpdate } from 'quidproquo-core';

import { askActiveTenantReadOrThrow } from '../../context/askActiveTenantReadOrThrow';

export function* askTenantKeyValueStoreUpdate<Value>(
  keyValueStoreName: string,
  updates: KvsUpdate,
  key: KvsCoreDataType,
  sortKey?: KvsCoreDataType,
): AskResponse<Value> {
  const tenantId = yield* askActiveTenantReadOrThrow();
  return yield* askKeyValueStoreUpdate<Value>(keyValueStoreName, updates, key, sortKey, { scope: tenantId });
}
