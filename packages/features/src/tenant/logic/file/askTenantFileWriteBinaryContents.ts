import { askFileWriteBinaryContents, AskResponse, QPQBinaryData, StorageDriveAdvancedWriteOptions } from 'quidproquo-core';

import { askActiveTenantReadOrThrow } from '../../context/askActiveTenantReadOrThrow';

export function* askTenantFileWriteBinaryContents(
  drive: string,
  filepath: string,
  data: QPQBinaryData,
  storageDriveAdvancedWriteOptions?: StorageDriveAdvancedWriteOptions,
): AskResponse<void> {
  const tenantId = yield* askActiveTenantReadOrThrow();
  return yield* askFileWriteBinaryContents(drive, filepath, data, storageDriveAdvancedWriteOptions, tenantId);
}
