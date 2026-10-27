import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askFileReadObjectJsonBase,
  createActionProcessor,
  FileActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import * as fs from 'fs/promises';

import { FileStorageConfig } from './types';
import { resolveFilePath } from './utils';

const getProcessFileReadObjectJson =
  (config: FileStorageConfig) =>
  (qpqConfig: QPQConfig): ProcessorFor<typeof askFileReadObjectJsonBase> => {
    return async ({ drive, filepath, scope }) => {
      try {
        const fullPath = resolveFilePath(config, qpqConfig, drive, filepath, scope);
        const content = await fs.readFile(fullPath, 'utf8');
        const jsonObject = JSON.parse(content);
        return actionResult(jsonObject);
      } catch (error: unknown) {
        return actionResultErrorFromCaughtError(error, {
          InvalidScopeError: (error) => actionResultError(askFileReadObjectJsonBase.errorType.InvalidScope, error.message),
          ENOENT: () => actionResultError(askFileReadObjectJsonBase.errorType.FileNotFound, `File not found: ${filepath}`), // node fs code
          SyntaxError: () => actionResultError(askFileReadObjectJsonBase.errorType.InvalidJson, `Invalid JSON in file: ${filepath}`), // JSON.parse failure
        });
      }
    };
  };

export const getFileReadObjectJsonActionProcessor = (config: FileStorageConfig) =>
  createActionProcessor(askFileReadObjectJsonBase, (qpqConfig) => getProcessFileReadObjectJson(config)(qpqConfig));
