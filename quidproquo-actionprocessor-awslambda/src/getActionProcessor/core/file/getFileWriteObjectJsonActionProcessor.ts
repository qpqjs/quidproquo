import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askFileWriteObjectJsonBase,
  composeStorageDriveFilePathOrThrow,
  createActionProcessor,
  FileActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { getS3BucketStorageClassFromStorageDriveTier } from '../../../awsLambdaUtils';
import { writeTextFile } from '../../../logic/s3/s3Utils';
import { resolveStorageDriveBucketName } from './utils';

const getProcessFileWriteObjectJson = (qpqConfig: QPQConfig): ProcessorFor<typeof askFileWriteObjectJsonBase> => {
  return async ({ drive, filepath, data, storageDriveAdvancedWriteOptions, scope }) => {
    const dataJson = JSON.stringify(data);

    try {
      const s3BucketName = resolveStorageDriveBucketName(drive, qpqConfig);
      await writeTextFile(
        s3BucketName,
        composeStorageDriveFilePathOrThrow(qpqConfig, drive, scope, filepath),
        dataJson,
        qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig),
        getS3BucketStorageClassFromStorageDriveTier(storageDriveAdvancedWriteOptions?.storageDriveTier),
      );

      return actionResult(void 0);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        AccessDenied: () => actionResultError(askFileWriteObjectJsonBase.errorType.AccessDenied, 'Access denied writing file'),
        Forbidden: () => actionResultError(askFileWriteObjectJsonBase.errorType.AccessDenied, 'Access denied writing file'),
        NoSuchBucket: () => actionResultError(askFileWriteObjectJsonBase.errorType.DriveNotFound, `Storage drive not found: ${drive}`),
        StorageDriveNotFoundError: (error) => actionResultError(askFileWriteObjectJsonBase.errorType.DriveNotFound, error.message),
        InvalidScopeError: (error) => actionResultError(askFileWriteObjectJsonBase.errorType.InvalidScope, error.message),
      });
    }
  };
};

export const getFileWriteObjectJsonActionProcessor = createActionProcessor(askFileWriteObjectJsonBase, getProcessFileWriteObjectJson);
