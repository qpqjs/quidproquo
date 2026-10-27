import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askFileWriteObjectJsonBase,
  createActionProcessor,
  FileActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import * as fs from 'fs/promises';

import { FileStorageConfig } from './types';
import { ensureParentDirectoryExists, resolveFilePath } from './utils';

const getProcessFileWriteObjectJson =
  (config: FileStorageConfig) =>
  (qpqConfig: QPQConfig): ProcessorFor<typeof askFileWriteObjectJsonBase> => {
    return async ({ drive, filepath, data, scope }) => {
      try {
        const fullPath = resolveFilePath(config, qpqConfig, drive, filepath, scope);
        await ensureParentDirectoryExists(fullPath);
        const jsonString = JSON.stringify(data, null, 2);
        await fs.writeFile(fullPath, jsonString, 'utf8');
        return actionResult(void 0);
      } catch (error: unknown) {
        return actionResultErrorFromCaughtError(error, {
          InvalidScopeError: (error) => actionResultError(askFileWriteObjectJsonBase.errorType.InvalidScope, error.message),
          EACCES: () => actionResultError(askFileWriteObjectJsonBase.errorType.AccessDenied, `Access denied writing file: ${filepath}`), // node fs code
        });
      }
    };
  };

export const getFileWriteObjectJsonActionProcessor = (config: FileStorageConfig) =>
  createActionProcessor(askFileWriteObjectJsonBase, (qpqConfig) => getProcessFileWriteObjectJson(config)(qpqConfig));
