import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askFileWriteTextContents,
  composeStorageDriveFilePathOrThrow,
  createActionProcessor,
  FileActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { getS3BucketStorageClassFromStorageDriveTier } from '../../../awsLambdaUtils';
import { writeTextFile } from '../../../logic/s3/s3Utils';
import { resolveStorageDriveBucketName } from './utils';

const getProcessFileWriteTextContents = (qpqConfig: QPQConfig): ProcessorFor<typeof askFileWriteTextContents> => {
  return async ({ drive, filepath, data, storageDriveAdvancedWriteOptions, scope }) => {
    try {
      const s3BucketName = resolveStorageDriveBucketName(drive, qpqConfig);
      await writeTextFile(
        s3BucketName,
        composeStorageDriveFilePathOrThrow(qpqConfig, drive, scope, filepath),
        data,
        qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig),
        getS3BucketStorageClassFromStorageDriveTier(storageDriveAdvancedWriteOptions?.storageDriveTier),
      );

      return actionResult(void 0);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        AccessDenied: () => actionResultError(askFileWriteTextContents.errorType.AccessDenied, 'Access denied writing file'),
        Forbidden: () => actionResultError(askFileWriteTextContents.errorType.AccessDenied, 'Access denied writing file'),
        NoSuchBucket: () => actionResultError(askFileWriteTextContents.errorType.DriveNotFound, `Storage drive not found: ${drive}`),
        StorageDriveNotFoundError: (error) => actionResultError(askFileWriteTextContents.errorType.DriveNotFound, error.message),
        InvalidScopeError: (error) => actionResultError(askFileWriteTextContents.errorType.InvalidScope, error.message),
      });
    }
  };
};

export const getFileWriteTextContentsActionProcessor = createActionProcessor(askFileWriteTextContents, getProcessFileWriteTextContents);
