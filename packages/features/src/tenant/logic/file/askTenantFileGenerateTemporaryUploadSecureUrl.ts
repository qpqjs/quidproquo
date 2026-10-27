import { askFileGenerateTemporaryUploadSecureUrl, AskResponse } from 'quidproquo-core';

import { askActiveTenantReadOrThrow } from '../../context/askActiveTenantReadOrThrow';

export function* askTenantFileGenerateTemporaryUploadSecureUrl(
  drive: string,
  filepath: string,
  expirationMs: number,
  advancedOptions?: {
    contentType?: string;
  },
): AskResponse<string> {
  const tenantId = yield* askActiveTenantReadOrThrow();
  return yield* askFileGenerateTemporaryUploadSecureUrl(drive, filepath, expirationMs, advancedOptions, tenantId);
}
