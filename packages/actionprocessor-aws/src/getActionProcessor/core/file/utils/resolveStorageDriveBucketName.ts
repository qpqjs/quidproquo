import { QPQConfig, qpqCoreUtils } from 'quidproquo-core';

import { getConfigRuntimeResourceNameFromConfigWithServiceOverride } from '../../../../awsNamingUtils';
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

  return getConfigRuntimeResourceNameFromConfigWithServiceOverride(
    storageDriveConfig.owner?.resourceNameOverride || drive,
    qpqConfig,
    storageDriveConfig.owner?.module,
  );
};
