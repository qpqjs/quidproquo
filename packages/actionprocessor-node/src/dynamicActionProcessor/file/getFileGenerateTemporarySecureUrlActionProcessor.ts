import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askFileGenerateTemporarySecureUrl,
  createActionProcessor,
  FileActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { createSecureUrlToken, getSecureUrlBaseUrl } from './secureUrlUtils';
import { FileStorageConfig } from './types';
import { resolveFilePath } from './utils';

// Mirror the AWS processor's SigV4 limit (7 days) so a story that would fail
// in production fails the same way on the dev server.
const maxExpirationMs = 7 * 24 * 60 * 60 * 1000;

const getProcessFileGenerateTemporarySecureUrl = (
  qpqConfig: QPQConfig,
  config: FileStorageConfig,
): ProcessorFor<typeof askFileGenerateTemporarySecureUrl> => {
  return async ({ drive, filepath, expirationMs, scope }) => {
    if (expirationMs > maxExpirationMs) {
      return actionResultError(
        askFileGenerateTemporarySecureUrl.errorType.ExpirationTooLong,
        'Expiration exceeds the 7 day maximum for presigned URLs',
      );
    }

    try {
      // Create a token for download
      const token = createSecureUrlToken(
        {
          fullFilepath: resolveFilePath(config, qpqConfig, drive, filepath, scope),
          operation: 'download',
          expiresAt: Date.now() + expirationMs,
        },
        config.secureUrlSecret,
      );

      // Build the secure URL
      const baseUrl = getSecureUrlBaseUrl(config);
      const url = `${baseUrl}/secure-download?token=${token}`;

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

export const getFileGenerateTemporarySecureUrlActionProcessor = (config: FileStorageConfig) =>
  createActionProcessor(askFileGenerateTemporarySecureUrl, (qpqConfig) => getProcessFileGenerateTemporarySecureUrl(qpqConfig, config));
