import { InvalidScopeError, InvalidScopeErrorCode } from './InvalidScopeError';

// Scopes are opaque ids (uuid-sized); anything longer is a misuse signal.
const MAX_SCOPE_LENGTH = 128;

// A scope must be usable as a single path segment and a single key prefix.
// Reject rather than sanitize: a scope containing separators or traversal
// sequences is never legitimate input, so normalizing it would only mask a bug
// (or an attack) upstream.
export function validateScopeSegment(scope: string): void {
  if (scope.trim().length === 0) {
    throw new InvalidScopeError(InvalidScopeErrorCode.empty, 'Scope must not be empty.');
  }

  if (scope.length > MAX_SCOPE_LENGTH) {
    throw new InvalidScopeError(InvalidScopeErrorCode.tooLong, `Scope must be at most ${MAX_SCOPE_LENGTH} characters.`);
  }

  if (scope.includes('/') || scope.includes('\\') || scope.includes('..') || scope.includes('\0')) {
    throw new InvalidScopeError(InvalidScopeErrorCode.unsafeCharacters, 'Scope must not contain path separators, "..", or null bytes.');
  }

  // '.' is the self-referencing path segment: a file composed under it
  // ('./file') resolves to the UNSCOPED root on any backend with path
  // resolution, escaping the scope entirely.
  if (scope === '.') {
    throw new InvalidScopeError(InvalidScopeErrorCode.unsafeCharacters, 'Scope must not be ".".');
  }

  // '@' starts the kvs reserved marker (KVS_RESERVED_MARKER), which a backend
  // may use to separate the scope from the key: a scope containing it could
  // forge or shadow another scope's composed prefix. Rejecting the single
  // character keeps that boundary unambiguous by construction.
  if (scope.includes('@')) {
    throw new InvalidScopeError(InvalidScopeErrorCode.unsafeCharacters, 'Scope must not contain "@".');
  }
}
