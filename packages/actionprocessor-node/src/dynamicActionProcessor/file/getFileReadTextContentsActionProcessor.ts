import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askFileReadTextContents,
  createActionProcessor,
  FileActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import * as fs from 'fs/promises';

import { FileStorageConfig } from './types';
import { resolveFilePath } from './utils';

const getProcessFileReadTextContents = (qpqConfig: QPQConfig, config: FileStorageConfig): ProcessorFor<typeof askFileReadTextContents> => {
  return async ({ drive, filepath, scope }) => {
    try {
      const fullPath = resolveFilePath(config, qpqConfig, drive, filepath, scope);
      const content = await fs.readFile(fullPath, 'utf8');
      return actionResult(content);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        InvalidScopeError: (error) => actionResultError(askFileReadTextContents.errorType.InvalidScope, error.message),
        ENOENT: () => actionResultError(askFileReadTextContents.errorType.FileNotFound, `File not found: ${filepath}`), // node fs code
      });
    }
  };
};

export const getFileReadTextContentsActionProcessor = (config: FileStorageConfig) =>
  createActionProcessor(askFileReadTextContents, (qpqConfig) => getProcessFileReadTextContents(qpqConfig, config));
