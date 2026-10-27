import { askFileDelete, AskResponse } from 'quidproquo-core';

import { askActiveTenantReadOrThrow } from '../../context/askActiveTenantReadOrThrow';

export function* askTenantFileDelete(drive: string, filepaths: string[]): AskResponse<string[]> {
  const tenantId = yield* askActiveTenantReadOrThrow();
  return yield* askFileDelete(drive, filepaths, tenantId);
}
