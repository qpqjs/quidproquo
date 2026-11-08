import { StorageDriveTier } from '@qpqjs/core';

import { S3StorageClassName } from './S3StorageClassName';

/**
 * The S3 storage class a storage drive tier means on AWS, the one mapping the runtime writes with and deploy builds
 * lifecycle transitions from. An omitted tier is intelligent tiering, so a write that names none costs the least.
 */
export const getS3StorageClassNameForStorageDriveTier = (storageDriveTier?: StorageDriveTier): S3StorageClassName => {
  switch (storageDriveTier) {
    case StorageDriveTier.REGULAR:
      return 'STANDARD';
    case StorageDriveTier.OCCASIONAL_ACCESS:
      return 'STANDARD_IA';
    case StorageDriveTier.SINGLE_ZONE_OCCASIONAL_ACCESS:
      return 'ONEZONE_IA';
    case StorageDriveTier.COLD_STORAGE:
      return 'GLACIER';
    case StorageDriveTier.COLD_STORAGE_INSTANT_ACCESS:
      return 'GLACIER_IR';
    case StorageDriveTier.DEEP_COLD_STORAGE:
      return 'DEEP_ARCHIVE';
    case StorageDriveTier.SMART_TIERING:
    default:
      return 'INTELLIGENT_TIERING';
  }
};
