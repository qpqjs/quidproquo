import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askFileReadTextContents,
  composeStorageDriveFilePathOrThrow,
  createActionProcessor,
  FileActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { readTextFile } from '../../../logic/s3/s3Utils';
import { resolveStorageDriveBucketName } from './utils';

const getProcessFileReadTextContents = (qpqConfig: QPQConfig): ProcessorFor<typeof askFileReadTextContents> => {
  return async ({ drive, filepath, scope }) => {
    try {
      const s3BucketName = resolveStorageDriveBucketName(drive, qpqConfig);
      const key = composeStorageDriveFilePathOrThrow(qpqConfig, drive, scope, filepath);

      return actionResult(await readTextFile(s3BucketName, key, qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig)));
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        InvalidObjectState: () => actionResultError(askFileReadTextContents.errorType.InvalidStorageClass, 'File is in the wrong storage class'),
        NoSuchKey: () => actionResultError(askFileReadTextContents.errorType.FileNotFound, `File not found: ${filepath}`),
        NotFound: () => actionResultError(askFileReadTextContents.errorType.FileNotFound, `File not found: ${filepath}`),
        InvalidScopeError: (error) => actionResultError(askFileReadTextContents.errorType.InvalidScope, error.message),
      });
    }
  };
};

export const getFileReadTextContentsActionProcessor = createActionProcessor(askFileReadTextContents, getProcessFileReadTextContents);
