import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askFileWriteTextContents,
  createActionProcessor,
  FileActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import * as fs from 'fs/promises';

import { FileStorageConfig } from './types';
import { ensureParentDirectoryExists, resolveFilePath } from './utils';

const getProcessFileWriteTextContents = (qpqConfig: QPQConfig, config: FileStorageConfig): ProcessorFor<typeof askFileWriteTextContents> => {
  return async ({ drive, filepath, data, scope }) => {
    try {
      const fullPath = resolveFilePath(config, qpqConfig, drive, filepath, scope);
      await ensureParentDirectoryExists(fullPath);
      await fs.writeFile(fullPath, data, 'utf8');
      return actionResult(void 0);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        InvalidScopeError: (error) => actionResultError(askFileWriteTextContents.errorType.InvalidScope, error.message),
        EACCES: () => actionResultError(askFileWriteTextContents.errorType.AccessDenied, `Access denied writing file: ${filepath}`), // node fs code
      });
    }
  };
};

export const getFileWriteTextContentsActionProcessor = (config: FileStorageConfig) =>
  createActionProcessor(askFileWriteTextContents, (qpqConfig) => getProcessFileWriteTextContents(qpqConfig, config));
