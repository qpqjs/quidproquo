import { askFileReadBinaryContents, AskResponse, QPQBinaryData } from 'quidproquo-core';

import { askActiveTenantReadOrThrow } from '../../context/askActiveTenantReadOrThrow';

export function* askTenantFileReadBinaryContents(drive: string, filepath: string): AskResponse<QPQBinaryData> {
  const tenantId = yield* askActiveTenantReadOrThrow();
  return yield* askFileReadBinaryContents(drive, filepath, tenantId);
}
