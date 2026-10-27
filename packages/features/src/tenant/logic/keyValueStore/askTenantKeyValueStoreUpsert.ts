import { askKeyValueStoreUpsert, AskResponse, KeyValueStoreUpsertOptions } from 'quidproquo-core';

import { askActiveTenantReadOrThrow } from '../../context/askActiveTenantReadOrThrow';

export function* askTenantKeyValueStoreUpsert<KvsItem>(
  keyValueStoreName: string,
  item: KvsItem,
  options?: Omit<KeyValueStoreUpsertOptions, 'scope'>,
): AskResponse<void> {
  const tenantId = yield* askActiveTenantReadOrThrow();
  return yield* askKeyValueStoreUpsert<KvsItem>(keyValueStoreName, item, { ...options, scope: tenantId });
}
