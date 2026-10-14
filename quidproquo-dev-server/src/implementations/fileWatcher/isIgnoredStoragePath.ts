const IGNORED_DIRECTORY_NAMES = new Set(['node_modules']);
const TEMP_FILE_SUFFIX = '.tmp';

/**
 * Whether a path relative to the storage root is outside what the watcher
 * reports: anything under a hidden entry or node_modules, and temp files
 * (the json file store writes `*.tmp` and renames it into place).
 */
export const isIgnoredStoragePath = (relativePath: string): boolean => {
  const segments = relativePath.split(/[\\/]/).filter((segment) => segment.length > 0);

  if (segments.some((segment) => segment.startsWith('.') || IGNORED_DIRECTORY_NAMES.has(segment))) {
    return true;
  }

  return segments.length > 0 && segments[segments.length - 1].endsWith(TEMP_FILE_SUFFIX);
};
