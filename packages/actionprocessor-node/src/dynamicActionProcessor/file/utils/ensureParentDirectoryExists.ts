import * as path from 'path';

import { ensureDirectoryExists } from './ensureDirectoryExists';

// Ensure the parent directory of a file exists
export const ensureParentDirectoryExists = async (filePath: string): Promise<void> => {
  const parentDir = path.dirname(filePath);
  await ensureDirectoryExists(parentDir);
};
