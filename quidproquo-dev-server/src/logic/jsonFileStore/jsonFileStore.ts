import { promises as fs } from 'fs';
import * as path from 'path';

// Generic { key: value } JSON file persistence under the dev server runtime path,
// shared by the parameter, secret and user stores. Files are re-read on every
// access so edits made while the server is running take effect immediately, and
// written pretty-printed so they stay hand-editable.

const getStoreFilePath = (runtimePath: string, storeDirectory: string, fileName: string): string =>
  path.join(runtimePath, storeDirectory, `${fileName}.json`);

export const readJsonFileStore = async <T>(runtimePath: string, storeDirectory: string, fileName: string): Promise<Record<string, T>> => {
  try {
    const raw = await fs.readFile(getStoreFilePath(runtimePath, storeDirectory, fileName), 'utf8');
    return JSON.parse(raw);
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return {};
    }
    throw error;
  }
};

export const writeJsonFileStore = async <T>(
  runtimePath: string,
  storeDirectory: string,
  fileName: string,
  values: Record<string, T>,
): Promise<void> => {
  const filePath = getStoreFilePath(runtimePath, storeDirectory, fileName);

  await fs.mkdir(path.dirname(filePath), { recursive: true });

  // Write-then-rename so a concurrent reader never sees a half-written file
  // (JSON.parse of a truncated store is a SyntaxError, not ENOENT)
  const tempFilePath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tempFilePath, JSON.stringify(values, null, 2));
  await fs.rename(tempFilePath, filePath);
};
