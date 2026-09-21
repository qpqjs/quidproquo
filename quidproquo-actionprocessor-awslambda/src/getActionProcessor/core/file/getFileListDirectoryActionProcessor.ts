import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askFileListDirectory,
  composeStorageDriveFilePathOrThrow,
  createActionProcessor,
  FileActionType,
  ProcessorFor,
  QPQConfig,
  stripScopedFilePath,
} from 'quidproquo-core';

import { listFiles } from '../../../logic/s3/s3Utils';
import { resolveStorageDriveBucketName } from './utils';

const getProcessFileListDirectory = (qpqConfig: QPQConfig): ProcessorFor<typeof askFileListDirectory> => {
  return async ({ drive, folderPath, maxFiles, pageToken, scope }) => {
    try {
      const s3BucketName = resolveStorageDriveBucketName(drive, qpqConfig);
      const s3FileList = await listFiles(
        s3BucketName,
        qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig),
        composeStorageDriveFilePathOrThrow(qpqConfig, drive, scope, folderPath),
        maxFiles,
        pageToken,
      );

      // S3 keys carry the scope prefix; strip it so callers see the same
      // scope-relative paths they passed in. Add the drive onto the list.
      const fileInfos = s3FileList.fileInfos.map((s3fi) => ({
        ...s3fi,
        filepath: stripScopedFilePath(scope, s3fi.filepath),
        drive,
      }));

      return actionResult({
        fileInfos,
        pageToken: s3FileList.pageToken,
      });
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        AccessDenied: () => actionResultError(askFileListDirectory.errorType.AccessDenied, 'Access denied listing directory'),
        Forbidden: () => actionResultError(askFileListDirectory.errorType.AccessDenied, 'Access denied listing directory'),
        NoSuchBucket: () => actionResultError(askFileListDirectory.errorType.DriveNotFound, `Storage drive not found: ${drive}`),
        StorageDriveNotFoundError: (error) => actionResultError(askFileListDirectory.errorType.DriveNotFound, error.message),
        InvalidScopeError: (error) => actionResultError(askFileListDirectory.errorType.InvalidScope, error.message),
      });
    }
  };
};

export const getFileListDirectoryActionProcessor = createActionProcessor(askFileListDirectory, getProcessFileListDirectory);
