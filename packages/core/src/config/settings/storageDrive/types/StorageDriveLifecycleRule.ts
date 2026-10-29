import { StorageDriveTransition } from './StorageDriveTransition';

export type StorageDriveLifecycleRule = {
  prefix?: string;
  transitions?: StorageDriveTransition[];
  deleteAfterDays?: number;
  fileSizeLessThan?: number;
  fileSizeGreaterThan?: number;
  enabled?: boolean;

  // TODO: @joe-coady: If we ever add versions
  // add noncurrentVersionExpiration / noncurrentVersionTransitions support
};
