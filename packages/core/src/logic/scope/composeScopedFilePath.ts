import { InvalidScopeError, InvalidScopeErrorCode } from './InvalidScopeError';
import { validateScopeSegment } from './validateScopeSegment';

// A scoped filepath must stay INSIDE its scope on every backend, including ones
// with no filesystem resolution of their own (S3 keys are flat strings, but a
// url normalizer or a future backend might resolve '..'). Reject outright -
// never normalize - so an escaping path can't even be composed.
const validateScopedFilePath = (filepath: string): void => {
  if (filepath.includes('\0')) {
    throw new InvalidScopeError(InvalidScopeErrorCode.unsafePath, 'Scoped file path must not contain null bytes.');
  }

  if (filepath.startsWith('/') || filepath.startsWith('\\')) {
    throw new InvalidScopeError(InvalidScopeErrorCode.unsafePath, 'Scoped file path must be relative.');
  }

  const segments = filepath.split(/[/\\]/);
  if (segments.some((segment) => segment === '..')) {
    throw new InvalidScopeError(InvalidScopeErrorCode.unsafePath, 'Scoped file path must not contain ".." segments.');
  }
};

// Prefix a filepath with its scope as a single extra path segment. Both parts
// are validated here so every backend (fs, s3, ...) gets the same guarantee:
// neither the scope nor the filepath can traverse out of the scope. Backends
// with real path resolution (node fs) still run their own escape check on top.
export function composeScopedFilePath(scope: string | undefined, filepath: string): string {
  if (scope === undefined) {
    return filepath;
  }

  validateScopeSegment(scope);
  validateScopedFilePath(filepath);

  return `${scope}/${filepath}`;
}
