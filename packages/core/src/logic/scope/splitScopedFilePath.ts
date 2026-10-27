import { InvalidScopeError, InvalidScopeErrorCode } from './InvalidScopeError';
import { validateScopeSegment } from './validateScopeSegment';

export type SplitScopedFilePath = {
  scope: string;
  filepath: string;
};

/**
 * Undo composeScopedFilePath on a stored path whose scope is NOT known up front
 * (a storage event for an object on a scoped drive). The first segment is the
 * scope. Throws InvalidScopeError when there is no scope segment or it fails
 * validation: on a scoped drive that object was written outside the framework.
 */
export function splitScopedFilePath(storedPath: string): SplitScopedFilePath {
  const separatorIndex = storedPath.indexOf('/');

  if (separatorIndex <= 0 || separatorIndex === storedPath.length - 1) {
    throw new InvalidScopeError(InvalidScopeErrorCode.scopeRequired, `Stored path '${storedPath}' has no scope segment.`);
  }

  const scope = storedPath.slice(0, separatorIndex);
  validateScopeSegment(scope);

  return { scope, filepath: storedPath.slice(separatorIndex + 1) };
}
