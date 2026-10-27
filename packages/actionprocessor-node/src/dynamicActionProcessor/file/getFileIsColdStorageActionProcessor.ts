import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askFileIsColdStorage,
  assertStorageDriveScopeRequirementOrThrow,
  createActionProcessor,
  FileActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { FileStorageConfig } from './types';

const getProcessFileIsColdStorage =
  (config: FileStorageConfig) =>
  (qpqConfig: QPQConfig): ProcessorFor<typeof askFileIsColdStorage> => {
    return async ({ drive, filepath, scope }) => {
      try {
        // The local filesystem has no cold tier, but a scoped drive still refuses
        // an unscoped call so local behaviour matches production.
        assertStorageDriveScopeRequirementOrThrow(qpqConfig, drive, scope);

        return actionResult(false);
      } catch (error: unknown) {
        return actionResultErrorFromCaughtError(error, {
          InvalidScopeError: (error) => actionResultError(askFileIsColdStorage.errorType.InvalidScope, error.message),
        });
      }
    };
  };

export const getFileIsColdStorageActionProcessor = (config: FileStorageConfig) =>
  createActionProcessor(askFileIsColdStorage, (qpqConfig) => getProcessFileIsColdStorage(config)(qpqConfig));
