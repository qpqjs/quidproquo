import { askFileGenerateTemporarySecureUrl, AskResponse } from 'quidproquo-core';

import { askActiveTenantReadOrThrow } from '../../context/askActiveTenantReadOrThrow';

export function* askTenantFileGenerateTemporarySecureUrl(drive: string, filepath: string, expirationMs: number): AskResponse<string> {
  const tenantId = yield* askActiveTenantReadOrThrow();
  return yield* askFileGenerateTemporarySecureUrl(drive, filepath, expirationMs, tenantId);
}
