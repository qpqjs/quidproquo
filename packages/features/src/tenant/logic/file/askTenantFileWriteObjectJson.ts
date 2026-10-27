import { askFileWriteObjectJson, AskResponse, StorageDriveAdvancedWriteOptions } from 'quidproquo-core';

import { askActiveTenantReadOrThrow } from '../../context/askActiveTenantReadOrThrow';

export function* askTenantFileWriteObjectJson<T extends object>(
  drive: string,
  filepath: string,
  data: T,
  storageDriveAdvancedWriteOptions?: StorageDriveAdvancedWriteOptions,
): AskResponse<void> {
  const tenantId = yield* askActiveTenantReadOrThrow();
  return yield* askFileWriteObjectJson<T>(drive, filepath, data, storageDriveAdvancedWriteOptions, tenantId);
}
