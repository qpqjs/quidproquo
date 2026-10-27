import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askFileGenerateTemporarySecureUrl,
  composeStorageDriveFilePathOrThrow,
  createActionProcessor,
  FileActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { generatePresignedUrl } from '../../../logic/s3/generatePresignedUrl';
import { resolveStorageDriveBucketName } from './utils';

// SigV4 presigned URLs cannot expire more than 7 days in the future
const maxExpirationMs = 7 * 24 * 60 * 60 * 1000;

const getProcessFileGenerateTemporarySecureUrl = (qpqConfig: QPQConfig): ProcessorFor<typeof askFileGenerateTemporarySecureUrl> => {
  return async ({ drive, filepath, expirationMs, scope }) => {
    if (expirationMs > maxExpirationMs) {
      return actionResultError(
        askFileGenerateTemporarySecureUrl.errorType.ExpirationTooLong,
        'Expiration exceeds the 7 day maximum for presigned URLs',
      );
    }

    try {
      const s3BucketName = resolveStorageDriveBucketName(drive, qpqConfig);
      const url = await generatePresignedUrl(
        s3BucketName,
        composeStorageDriveFilePathOrThrow(qpqConfig, drive, scope, filepath),
        qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig),
        expirationMs,
      );

      return actionResult(url);
    } catch (error: unknown) {
      // Name-keyed, not instanceof: under npm link / module federation the
      // error can come from another copy of quidproquo-core.
      return actionResultErrorFromCaughtError(error, {
        InvalidScopeError: (error) => actionResultError(askFileGenerateTemporarySecureUrl.errorType.InvalidScope, error.message),
      });
    }
  };
};

export const getFileGenerateTemporarySecureUrlActionProcessor = createActionProcessor(
  askFileGenerateTemporarySecureUrl,
  getProcessFileGenerateTemporarySecureUrl,
);
