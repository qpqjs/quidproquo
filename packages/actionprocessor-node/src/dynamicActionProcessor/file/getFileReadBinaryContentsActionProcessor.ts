import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askFileReadBinaryContents,
  createActionProcessor,
  FileActionType,
  ProcessorFor,
  QPQBinaryData,
  QPQConfig,
} from 'quidproquo-core';

import * as fs from 'fs/promises';
import * as path from 'path';

import { FileStorageConfig } from './types';
import { resolveFilePath } from './utils';

const getProcessFileReadBinaryContents =
  (config: FileStorageConfig) =>
  (qpqConfig: QPQConfig): ProcessorFor<typeof askFileReadBinaryContents> => {
    return async ({ drive, filepath, scope }) => {
      try {
        const fullPath = resolveFilePath(config, qpqConfig, drive, filepath, scope);
        const buffer = await fs.readFile(fullPath);

        // Convert Buffer to QPQBinaryData
        const binaryData: QPQBinaryData = {
          base64Data: buffer.toString('base64'),
          filename: path.basename(filepath),
          mimetype: 'application/octet-stream', // Default mimetype for binary files
        };

        return actionResult(binaryData);
      } catch (error: unknown) {
        return actionResultErrorFromCaughtError(error, {
          InvalidScopeError: (error) => actionResultError(askFileReadBinaryContents.errorType.InvalidScope, error.message),
          ENOENT: () => actionResultError(askFileReadBinaryContents.errorType.FileNotFound, `File not found: ${filepath}`), // node fs code
        });
      }
    };
  };

export const getFileReadBinaryContentsActionProcessor = (config: FileStorageConfig) =>
  createActionProcessor(askFileReadBinaryContents, (qpqConfig) => getProcessFileReadBinaryContents(config)(qpqConfig));
