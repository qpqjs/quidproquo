import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askFileWriteBinaryContents,
  composeStorageDriveFilePathOrThrow,
  createActionProcessor,
  FileActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { getS3BucketStorageClassFromStorageDriveTier } from '../../../awsLambdaUtils';
import { writeBinaryFile } from '../../../logic/s3/s3Utils';
import { resolveStorageDriveBucketName } from './utils';

const getProcessFileWriteBinaryContents = (qpqConfig: QPQConfig): ProcessorFor<typeof askFileWriteBinaryContents> => {
  return async ({ drive, filepath, data, storageDriveAdvancedWriteOptions, scope }) => {
    try {
      const s3BucketName = resolveStorageDriveBucketName(drive, qpqConfig);
      await writeBinaryFile(
        s3BucketName,
        composeStorageDriveFilePathOrThrow(qpqConfig, drive, scope, filepath),
        data,
        qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig),
        getS3BucketStorageClassFromStorageDriveTier(storageDriveAdvancedWriteOptions?.storageDriveTier),
      );

      return actionResult(void 0);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        AccessDenied: () => actionResultError(askFileWriteBinaryContents.errorType.AccessDenied, 'Access denied writing file'),
        Forbidden: () => actionResultError(askFileWriteBinaryContents.errorType.AccessDenied, 'Access denied writing file'),
        NoSuchBucket: () => actionResultError(askFileWriteBinaryContents.errorType.DriveNotFound, `Storage drive not found: ${drive}`),
        StorageDriveNotFoundError: (error) => actionResultError(askFileWriteBinaryContents.errorType.DriveNotFound, error.message),
        InvalidScopeError: (error) => actionResultError(askFileWriteBinaryContents.errorType.InvalidScope, error.message),
      });
    }
  };
};

export const getFileWriteBinaryContentsActionProcessor = createActionProcessor(askFileWriteBinaryContents, getProcessFileWriteBinaryContents);
