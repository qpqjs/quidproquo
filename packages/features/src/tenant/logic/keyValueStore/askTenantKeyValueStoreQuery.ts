import { askKeyValueStoreQuery, AskResponse, KeyValueStoreQueryOptions, KvsQueryOperation, QpqPagedData } from 'quidproquo-core';

import { askActiveTenantReadOrThrow } from '../../context/askActiveTenantReadOrThrow';

export function* askTenantKeyValueStoreQuery<KvsItem>(
  keyValueStoreName: string,
  keyCondition: KvsQueryOperation,
  options?: Omit<KeyValueStoreQueryOptions, 'scope'>,
): AskResponse<QpqPagedData<KvsItem>> {
  const tenantId = yield* askActiveTenantReadOrThrow();
  return yield* askKeyValueStoreQuery<KvsItem>(keyValueStoreName, keyCondition, { ...options, scope: tenantId });
}
