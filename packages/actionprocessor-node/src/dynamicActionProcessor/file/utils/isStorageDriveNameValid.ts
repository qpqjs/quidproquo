import { QPQConfig, qpqCoreUtils } from '@qpqjs/core';

// Resolve a drive name to a filesystem path
export const isStorageDriveNameValid = (drive: string, qpqConfig: QPQConfig): boolean => {
  const storageDrive = qpqCoreUtils.getStorageDriveByName(drive, qpqConfig);

  if (!storageDrive) {
    return false;
  }

  return true;
};
