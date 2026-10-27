import { askFileReadObjectJson, AskResponse } from 'quidproquo-core';

import { askActiveTenantReadOrThrow } from '../../context/askActiveTenantReadOrThrow';

export function* askTenantFileReadObjectJson<T extends object>(drive: string, filepath: string): AskResponse<T> {
  const tenantId = yield* askActiveTenantReadOrThrow();
  return yield* askFileReadObjectJson<T>(drive, filepath, tenantId);
}
