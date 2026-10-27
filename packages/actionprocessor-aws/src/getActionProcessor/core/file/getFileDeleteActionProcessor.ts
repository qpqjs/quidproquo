import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askFileDelete,
  composeStorageDriveFilePathOrThrow,
  createActionProcessor,
  FileActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { deleteFiles } from '../../../logic/s3/s3Utils';
import { resolveStorageDriveBucketName } from './utils';

const getProcessFileDelete = (qpqConfig: QPQConfig): ProcessorFor<typeof askFileDelete> => {
  return async ({ drive, filepaths, scope }) => {
    try {
      const s3BucketName = resolveStorageDriveBucketName(drive, qpqConfig);
      const keys = filepaths.map((filepath) => composeStorageDriveFilePathOrThrow(qpqConfig, drive, scope, filepath));

      // Per-file delete failures come back as a normal result (the keys that
      // errored) so callers can retry them; only whole-call failures error.
      const errored = await deleteFiles(s3BucketName, keys, qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig));

      return actionResult(errored);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        AccessDenied: () => actionResultError(askFileDelete.errorType.AccessDenied, 'Access denied deleting files'),
        NoSuchBucket: () => actionResultError(askFileDelete.errorType.DriveNotFound, `Storage drive not found: ${drive}`),
        StorageDriveNotFoundError: (error) => actionResultError(askFileDelete.errorType.DriveNotFound, error.message),
        InvalidScopeError: (error) => actionResultError(askFileDelete.errorType.InvalidScope, error.message),
      });
    }
  };
};

export const getFileDeleteActionProcessor = createActionProcessor(askFileDelete, getProcessFileDelete);
