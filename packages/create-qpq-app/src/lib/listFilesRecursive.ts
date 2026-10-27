import fs from 'fs';
import path from 'path';

// Depth-first list of every file under root (root must exist).
export const listFilesRecursive = (root: string): string[] => {
  const files: string[] = [];

  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  };

  walk(root);
  return files;
};
