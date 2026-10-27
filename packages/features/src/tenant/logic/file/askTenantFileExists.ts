import { askFileExists, AskResponse } from 'quidproquo-core';

import { askActiveTenantReadOrThrow } from '../../context/askActiveTenantReadOrThrow';

export function* askTenantFileExists(drive: string, filepath: string): AskResponse<boolean> {
  const tenantId = yield* askActiveTenantReadOrThrow();
  return yield* askFileExists(drive, filepath, tenantId);
}
