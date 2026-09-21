import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askFileExists,
  composeStorageDriveFilePathOrThrow,
  createActionProcessor,
  FileActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { objectExists } from '../../../logic/s3/s3Utils';
import { resolveStorageDriveBucketName } from './utils';

const getProcessFileExists = (qpqConfig: QPQConfig): ProcessorFor<typeof askFileExists> => {
  return async ({ drive, filepath, scope }) => {
    try {
      const s3BucketName = resolveStorageDriveBucketName(drive, qpqConfig);
      const key = composeStorageDriveFilePathOrThrow(qpqConfig, drive, scope, filepath);
      return actionResult(await objectExists(s3BucketName, key, qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig)));
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        AccessDenied: () => actionResultError(askFileExists.errorType.AccessDenied, 'Access denied checking file existence'),
        Forbidden: () => actionResultError(askFileExists.errorType.AccessDenied, 'Access denied checking file existence'),
        InvalidScopeError: (error) => actionResultError(askFileExists.errorType.InvalidScope, error.message),
      });
    }
  };
};

export const getFileExistsActionProcessor = createActionProcessor(askFileExists, getProcessFileExists);
