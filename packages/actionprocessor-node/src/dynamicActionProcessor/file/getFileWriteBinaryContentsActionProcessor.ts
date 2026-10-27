import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askFileWriteBinaryContents,
  createActionProcessor,
  FileActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import * as fs from 'fs/promises';

import { FileStorageConfig } from './types';
import { ensureParentDirectoryExists, resolveFilePath } from './utils';

const getProcessFileWriteBinaryContents =
  (config: FileStorageConfig) =>
  (qpqConfig: QPQConfig): ProcessorFor<typeof askFileWriteBinaryContents> => {
    return async ({ drive, filepath, data, scope }) => {
      try {
        const fullPath = resolveFilePath(config, qpqConfig, drive, filepath, scope);
        await ensureParentDirectoryExists(fullPath);

        // Convert QPQBinaryData to Buffer
        const buffer = Buffer.from(data.base64Data, 'base64');
        await fs.writeFile(fullPath, buffer);

        if (data.mimetype || data.contentDisposition) {
          await fs.writeFile(
            `${fullPath}.qpqmeta.json`,
            JSON.stringify({
              mimetype: data.mimetype,
              contentDisposition: data.contentDisposition,
            }),
          );
        }

        return actionResult(void 0);
      } catch (error: unknown) {
        return actionResultErrorFromCaughtError(error, {
          InvalidScopeError: (error) => actionResultError(askFileWriteBinaryContents.errorType.InvalidScope, error.message),
          EACCES: () => actionResultError(askFileWriteBinaryContents.errorType.AccessDenied, `Access denied writing file: ${filepath}`), // node fs code
        });
      }
    };
  };

export const getFileWriteBinaryContentsActionProcessor = (config: FileStorageConfig) =>
  createActionProcessor(askFileWriteBinaryContents, (qpqConfig) => getProcessFileWriteBinaryContents(config)(qpqConfig));
