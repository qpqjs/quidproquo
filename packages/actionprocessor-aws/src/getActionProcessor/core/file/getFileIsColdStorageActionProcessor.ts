import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askFileIsColdStorage,
  composeStorageDriveFilePathOrThrow,
  createActionProcessor,
  FileActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { getObjectStorageClass } from '../../../logic/s3/getObjectStorageClass';
import { resolveStorageDriveBucketName } from './utils';

const getProcessFileIsColdStorage = (qpqConfig: QPQConfig): ProcessorFor<typeof askFileIsColdStorage> => {
  return async ({ drive, filepath, scope }) => {
    try {
      const s3BucketName = resolveStorageDriveBucketName(drive, qpqConfig);
      const key = composeStorageDriveFilePathOrThrow(qpqConfig, drive, scope, filepath);
      const isColdStorage =
        (await getObjectStorageClass(s3BucketName, key, qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig))) === 'cold_storage';

      return actionResult(isColdStorage);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        AccessDenied: () => actionResultError(askFileIsColdStorage.errorType.AccessDenied, 'Access denied reading file storage class'),
        Forbidden: () => actionResultError(askFileIsColdStorage.errorType.AccessDenied, 'Access denied reading file storage class'),
        NotFound: () => actionResultError(askFileIsColdStorage.errorType.FileNotFound, `File not found: ${filepath}`),
        NoSuchKey: () => actionResultError(askFileIsColdStorage.errorType.FileNotFound, `File not found: ${filepath}`),
        NoSuchBucket: () => actionResultError(askFileIsColdStorage.errorType.DriveNotFound, `Storage drive not found: ${drive}`),
        StorageDriveNotFoundError: (error) => actionResultError(askFileIsColdStorage.errorType.DriveNotFound, error.message),
        InvalidScopeError: (error) => actionResultError(askFileIsColdStorage.errorType.InvalidScope, error.message),
      });
    }
  };
};

export const getFileIsColdStorageActionProcessor = createActionProcessor(askFileIsColdStorage, getProcessFileIsColdStorage);
