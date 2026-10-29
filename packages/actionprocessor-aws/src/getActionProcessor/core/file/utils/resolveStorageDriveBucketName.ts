import { QPQConfig, qpqCoreUtils } from '@qpqjs/core';

import { resolveOwnedResourceName } from '../../../../awsNamingUtils';
import { StorageDriveNotFoundError } from './StorageDriveNotFoundError';

/**
 * Resolves the runtime S3 bucket name for a configured storage drive,
 * honouring cross-module ownership overrides. Throws StorageDriveNotFoundError
 * when no defineStorageDrive matches the drive name.
 */
export const resolveStorageDriveBucketName = (drive: string, qpqConfig: QPQConfig): string => {
  const storageDriveConfig = qpqCoreUtils.getStorageDriveByName(drive, qpqConfig);

  if (!storageDriveConfig) {
    throw new StorageDriveNotFoundError(drive);
  }

  return resolveOwnedResourceName(drive, qpqConfig, storageDriveConfig.owner);
};
