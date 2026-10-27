import { QPQConfig } from '../../config';
import { getStorageDriveByName } from '../../qpqCoreUtils';
import { composeScopedFilePath } from './composeScopedFilePath';
import { InvalidScopeError, InvalidScopeErrorCode } from './InvalidScopeError';

// THE shared scope gate for every file backend (s3, node fs, ...). The drive's
// `scoped` flag and the call's scope must agree: a scoped drive refuses a call
// without one, an unscoped drive refuses a call with one, so a mismatch is an
// error rather than a different path. An unknown drive is left for the backend
// to report as its own DriveNotFound.
export const assertStorageDriveScopeRequirementOrThrow = (qpqConfig: QPQConfig, drive: string, scope: string | undefined): void => {
  const driveConfig = getStorageDriveByName(drive, qpqConfig);

  if (!driveConfig) {
    return;
  }

  if (driveConfig.scoped && scope === undefined) {
    throw new InvalidScopeError(InvalidScopeErrorCode.scopeRequired, `Storage drive '${drive}' is scoped; every file action must carry a scope.`);
  }

  if (!driveConfig.scoped && scope !== undefined) {
    throw new InvalidScopeError(InvalidScopeErrorCode.notScoped, `Storage drive '${drive}' is not scoped; declare it scoped or drop the scope.`);
  }
};

/**
 * Gate then compose: the path a key-based backend (s3) stores under. Throws
 * InvalidScopeError when the drive is scoped and no scope was given, or when
 * the scope or filepath fails validation.
 */
export const composeStorageDriveFilePathOrThrow = (qpqConfig: QPQConfig, drive: string, scope: string | undefined, filepath: string): string => {
  assertStorageDriveScopeRequirementOrThrow(qpqConfig, drive, scope);

  return composeScopedFilePath(scope, filepath);
};
