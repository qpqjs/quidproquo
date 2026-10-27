import { askFileIsColdStorage, AskResponse } from 'quidproquo-core';

import { askActiveTenantReadOrThrow } from '../../context/askActiveTenantReadOrThrow';

export function* askTenantFileIsColdStorage(drive: string, filepath: string): AskResponse<boolean> {
  const tenantId = yield* askActiveTenantReadOrThrow();
  return yield* askFileIsColdStorage(drive, filepath, tenantId);
}
