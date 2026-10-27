import { askFileReadBinaryContents, AskResponse, QPQBinaryData } from '@qpqjs/core';

import { askActiveTenantReadOrThrow } from '../../context/askActiveTenantReadOrThrow';

export function* askTenantFileReadBinaryContents(drive: string, filepath: string): AskResponse<QPQBinaryData> {
  const tenantId = yield* askActiveTenantReadOrThrow();
  return yield* askFileReadBinaryContents(drive, filepath, tenantId);
}
