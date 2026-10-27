import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askFileReadBinaryContents,
  composeStorageDriveFilePathOrThrow,
  createActionProcessor,
  FileActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { readBinaryFile } from '../../../logic/s3/s3Utils';
import { resolveStorageDriveBucketName } from './utils';

const getProcessFileReadBinaryContents = (qpqConfig: QPQConfig): ProcessorFor<typeof askFileReadBinaryContents> => {
  return async ({ drive, filepath, scope }) => {
    try {
      const s3BucketName = resolveStorageDriveBucketName(drive, qpqConfig);
      const key = composeStorageDriveFilePathOrThrow(qpqConfig, drive, scope, filepath);

      return actionResult(await readBinaryFile(s3BucketName, key, qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig)));
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        InvalidObjectState: () => actionResultError(askFileReadBinaryContents.errorType.InvalidStorageClass, 'File is in the wrong storage class'),
        NoSuchKey: () => actionResultError(askFileReadBinaryContents.errorType.FileNotFound, `File not found: ${filepath}`),
        NotFound: () => actionResultError(askFileReadBinaryContents.errorType.FileNotFound, `File not found: ${filepath}`),
        InvalidScopeError: (error) => actionResultError(askFileReadBinaryContents.errorType.InvalidScope, error.message),
      });
    }
  };
};

export const getFileReadBinaryContentsActionProcessor = createActionProcessor(askFileReadBinaryContents, getProcessFileReadBinaryContents);
