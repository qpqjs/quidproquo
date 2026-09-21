import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askFileCopy,
  composeStorageDriveFilePathOrThrow,
  createActionProcessor,
  FileActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { copyFile } from '../../../logic/s3/s3Utils';
import { resolveStorageDriveBucketName } from './utils';

const getProcessFileCopy = (qpqConfig: QPQConfig): ProcessorFor<typeof askFileCopy> => {
  return async ({ sourceDrive, sourceFilepath, targetDrive, targetFilepath, scope }) => {
    try {
      const sourceBucketName = resolveStorageDriveBucketName(sourceDrive, qpqConfig);
      const targetBucketName = resolveStorageDriveBucketName(targetDrive, qpqConfig);

      await copyFile(
        sourceBucketName,
        composeStorageDriveFilePathOrThrow(qpqConfig, sourceDrive, scope, sourceFilepath),
        targetBucketName,
        composeStorageDriveFilePathOrThrow(qpqConfig, targetDrive, scope, targetFilepath),
        qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig),
      );

      return actionResult(void 0);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        AccessDenied: () => actionResultError(askFileCopy.errorType.AccessDenied, 'Access denied copying file'),
        NoSuchBucket: () => actionResultError(askFileCopy.errorType.DriveNotFound, `Storage drive not found: ${sourceDrive} or ${targetDrive}`),
        NoSuchKey: () => actionResultError(askFileCopy.errorType.FileNotFound, `File not found: ${sourceFilepath}`),
        StorageDriveNotFoundError: (error) => actionResultError(askFileCopy.errorType.DriveNotFound, error.message),
        InvalidScopeError: (error) => actionResultError(askFileCopy.errorType.InvalidScope, error.message),
      });
    }
  };
};

export const getFileCopyActionProcessor = createActionProcessor(askFileCopy, getProcessFileCopy);
