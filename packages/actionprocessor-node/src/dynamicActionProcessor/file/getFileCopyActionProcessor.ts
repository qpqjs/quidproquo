import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askFileCopy,
  createActionProcessor,
  FileActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import * as fs from 'fs/promises';

import { FileStorageConfig } from './types';
import { ensureParentDirectoryExists, resolveFilePath } from './utils';

// The sidecar the binary-write processor and the secure-upload endpoint persist beside an object
// (mimetype + content disposition). Copied with the object so the copy serves the same way.
const metaPath = (fullPath: string): string => `${fullPath}.qpqmeta.json`;

const getProcessFileCopy =
  (config: FileStorageConfig) =>
  (qpqConfig: QPQConfig): ProcessorFor<typeof askFileCopy> => {
    return async ({ sourceDrive, sourceFilepath, targetDrive, targetFilepath, scope }) => {
      try {
        const sourcePath = resolveFilePath(config, qpqConfig, sourceDrive, sourceFilepath, scope);
        const targetPath = resolveFilePath(config, qpqConfig, targetDrive, targetFilepath, scope);
        await ensureParentDirectoryExists(targetPath);

        await fs.copyFile(sourcePath, targetPath);

        try {
          await fs.copyFile(metaPath(sourcePath), metaPath(targetPath));
        } catch (error: unknown) {
          // No sidecar on the source → nothing to carry across.
          if ((error as { code?: string }).code !== 'ENOENT') {
            throw error;
          }
        }

        return actionResult(void 0);
      } catch (error: unknown) {
        return actionResultErrorFromCaughtError(error, {
          InvalidScopeError: (error) => actionResultError(askFileCopy.errorType.InvalidScope, error.message),
          ENOENT: () => actionResultError(askFileCopy.errorType.FileNotFound, `File not found: ${sourceFilepath}`), // node fs code
          EACCES: () => actionResultError(askFileCopy.errorType.AccessDenied, `Access denied copying file: ${sourceFilepath}`), // node fs code
        });
      }
    };
  };

export const getFileCopyActionProcessor = (config: FileStorageConfig) =>
  createActionProcessor(askFileCopy, (qpqConfig) => getProcessFileCopy(config)(qpqConfig));
