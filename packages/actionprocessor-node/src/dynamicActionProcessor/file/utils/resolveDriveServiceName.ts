import { QPQConfig, qpqCoreUtils } from '@qpqjs/core';

// Resolve the service that owns a drive's on-disk location. Drives declared with
// `owner.module` are shared across services, so every caller reads and writes
// under the owner's folder, mirroring how AWS resolves the bucket by owner.
export function resolveDriveServiceName(drive: string, qpqConfig: QPQConfig): string {
  const storageDrive = qpqCoreUtils.getStorageDriveByName(drive, qpqConfig);
  return qpqCoreUtils.resolveOwnerModuleName(storageDrive?.owner, qpqConfig);
}
