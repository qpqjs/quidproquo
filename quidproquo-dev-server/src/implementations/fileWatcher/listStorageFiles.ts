import { Dirent } from 'fs';
import * as fs from 'fs/promises';
import * as path from 'path';

import { isIgnoredStoragePath } from './isIgnoredStoragePath';
import { isMissingPathError } from './isMissingPathError';

const collectStorageFiles = async (storagePath: string, directory: string, files: string[]): Promise<void> => {
  let entries: Dirent[];

  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    // A directory removed mid-walk has nothing left to list.
    if (isMissingPathError(error)) {
      return;
    }

    throw error;
  }

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (isIgnoredStoragePath(path.relative(storagePath, entryPath))) {
      continue;
    }

    if (entry.isDirectory()) {
      await collectStorageFiles(storagePath, entryPath, files);
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }
};

/**
 * Every regular file under directory (default: the whole storage root) as an
 * absolute path. Ignored entries are pruned, symlinks are not followed, and a
 * directory that disappears mid-walk lists as empty.
 */
export const listStorageFiles = async (storagePath: string, directory: string = storagePath): Promise<string[]> => {
  const files: string[] = [];

  await collectStorageFiles(storagePath, directory, files);

  return files;
};
