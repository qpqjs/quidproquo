// Undo composeScopedFilePath on a path read back from storage (e.g. an S3 key
// from a directory listing), so callers see the same scope-relative paths they
// pass in. A path without the expected prefix is returned unchanged (it was
// stored unscoped).
export function stripScopedFilePath(scope: string | undefined, storedPath: string): string {
  if (scope === undefined) {
    return storedPath;
  }

  const prefix = `${scope}/`;
  return storedPath.startsWith(prefix) ? storedPath.slice(prefix.length) : storedPath;
}
