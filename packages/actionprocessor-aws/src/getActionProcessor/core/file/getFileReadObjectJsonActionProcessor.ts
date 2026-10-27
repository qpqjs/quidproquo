import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askFileReadObjectJsonBase,
  composeStorageDriveFilePathOrThrow,
  createActionProcessor,
  FileActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { readTextFile } from '../../../logic/s3/s3Utils';
import { resolveStorageDriveBucketName } from './utils';

const getProcessFileReadObjectJson = (qpqConfig: QPQConfig): ProcessorFor<typeof askFileReadObjectJsonBase> => {
  return async ({ drive, filepath, scope }) => {
    try {
      const s3BucketName = resolveStorageDriveBucketName(drive, qpqConfig);
      const key = composeStorageDriveFilePathOrThrow(qpqConfig, drive, scope, filepath);

      const json = await readTextFile(s3BucketName, key, qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig));

      const obj = JSON.parse(json);

      return actionResult(obj);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        InvalidObjectState: () => actionResultError(askFileReadObjectJsonBase.errorType.InvalidStorageClass, 'File is in the wrong storage class'),
        NoSuchKey: () => actionResultError(askFileReadObjectJsonBase.errorType.FileNotFound, `File not found: ${filepath}`),
        NotFound: () => actionResultError(askFileReadObjectJsonBase.errorType.FileNotFound, `File not found: ${filepath}`),
        SyntaxError: () => actionResultError(askFileReadObjectJsonBase.errorType.InvalidJson, `Invalid JSON in file: ${filepath}`), // JSON.parse failure
        InvalidScopeError: (error) => actionResultError(askFileReadObjectJsonBase.errorType.InvalidScope, error.message),
      });
    }
  };
};

export const getFileReadObjectJsonActionProcessor = createActionProcessor(askFileReadObjectJsonBase, getProcessFileReadObjectJson);
