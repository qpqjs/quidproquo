import { askKeyValueStoreScan, AskResponse, KvsQueryOperation, QpqPagedData } from 'quidproquo-core';

import { askActiveTenantReadOrThrow } from '../../context/askActiveTenantReadOrThrow';

export function* askTenantKeyValueStoreScan<KvsItem>(
  keyValueStoreName: string,
  filterCondition?: KvsQueryOperation,
  nextPageKey?: string,
): AskResponse<QpqPagedData<KvsItem>> {
  const tenantId = yield* askActiveTenantReadOrThrow();
  return yield* askKeyValueStoreScan<KvsItem>(keyValueStoreName, filterCondition, nextPageKey, { scope: tenantId });
}
