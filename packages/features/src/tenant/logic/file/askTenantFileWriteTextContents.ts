import { askFileWriteTextContents, AskResponse, StorageDriveAdvancedWriteOptions } from 'quidproquo-core';

import { askActiveTenantReadOrThrow } from '../../context/askActiveTenantReadOrThrow';

export function* askTenantFileWriteTextContents(
  drive: string,
  filepath: string,
  data: string,
  storageDriveAdvancedWriteOptions?: StorageDriveAdvancedWriteOptions,
): AskResponse<void> {
  const tenantId = yield* askActiveTenantReadOrThrow();
  return yield* askFileWriteTextContents(drive, filepath, data, storageDriveAdvancedWriteOptions, tenantId);
}
