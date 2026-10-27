import { askFileReadTextContents, AskResponse } from '@qpqjs/core';

import { askActiveTenantReadOrThrow } from '../../context/askActiveTenantReadOrThrow';

export function* askTenantFileReadTextContents(drive: string, filepath: string): AskResponse<string> {
  const tenantId = yield* askActiveTenantReadOrThrow();
  return yield* askFileReadTextContents(drive, filepath, tenantId);
}
