import * as fs from 'fs/promises';

// Ensure a directory exists
export const ensureDirectoryExists = async (dirPath: string): Promise<void> => {
  await fs.mkdir(dirPath, { recursive: true });
};
