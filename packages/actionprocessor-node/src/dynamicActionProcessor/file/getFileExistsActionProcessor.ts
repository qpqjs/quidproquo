import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askFileExists,
  createActionProcessor,
  FileActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import * as fs from 'fs/promises';

import { FileStorageConfig } from './types';
import { resolveFilePath } from './utils';

const getProcessFileExists = (qpqConfig: QPQConfig, config: FileStorageConfig): ProcessorFor<typeof askFileExists> => {
  return async ({ drive, filepath, scope }) => {
    try {
      const fullPath = resolveFilePath(config, qpqConfig, drive, filepath, scope);

      try {
        await fs.access(fullPath);
        return actionResult(true);
      } catch (error: any) {
        // Missing file is a definitive false; permission problems must surface.
        if (error.code === 'ENOENT') {
          return actionResult(false);
        }
        if (error.code === 'EACCES') {
          return actionResultError(askFileExists.errorType.AccessDenied, `Access denied checking file existence: ${filepath}`);
        }
        throw error;
      }
    } catch (error: unknown) {
      // Name-keyed, not instanceof: under npm link / module federation the
      // error can come from another copy of quidproquo-core.
      return actionResultErrorFromCaughtError(error, {
        InvalidScopeError: (error) => actionResultError(askFileExists.errorType.InvalidScope, error.message),
      });
    }
  };
};

export const getFileExistsActionProcessor = (config: FileStorageConfig) =>
  createActionProcessor(askFileExists, (qpqConfig) => getProcessFileExists(qpqConfig, config));
