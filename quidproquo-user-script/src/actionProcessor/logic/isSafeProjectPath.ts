/**
 * Whether a path from an untrusted source (a drive listing, a zip entry) may be written
 * under a project directory: relative, forward slashes only, no `..`, no empty segment.
 */
export const isSafeProjectPath = (relativePath: string): boolean =>
  relativePath.length > 0 &&
  !relativePath.includes('\\') &&
  !relativePath.startsWith('/') &&
  !relativePath.split('/').some((segment) => segment === '' || segment === '.' || segment === '..');
