import { askKeyValueStoreDelete, AskResponse, KvsCoreDataType } from 'quidproquo-core';

import { askActiveTenantReadOrThrow } from '../../context/askActiveTenantReadOrThrow';

export function* askTenantKeyValueStoreDelete(keyValueStoreName: string, key: KvsCoreDataType, sortKey?: KvsCoreDataType): AskResponse<void> {
  const tenantId = yield* askActiveTenantReadOrThrow();
  return yield* askKeyValueStoreDelete(keyValueStoreName, key, sortKey, { scope: tenantId });
}
