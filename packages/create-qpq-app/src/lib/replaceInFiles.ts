import fs from 'fs';
import path from 'path';

import { listFilesRecursive } from './listFilesRecursive';

// Extensions the rename sweeps are allowed to touch. Everything else
// (images, favicons, fonts) passes through untouched.
const TEXT_FILE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.html', '.css', '.md', '.yml', '.yaml']);

// Apply literal (non-regex) string replacements to every text file under
// root. Replacement tokens are chosen to be collision-free ('@todo/',
// 'apps/todo/'), so this is a mechanical sweep, not a heuristic one.
export const replaceInFiles = (root: string, replacements: Array<[from: string, to: string]>): void => {
  for (const filePath of listFilesRecursive(root)) {
    if (!TEXT_FILE_EXTENSIONS.has(path.extname(filePath))) {
      continue;
    }

    const original = fs.readFileSync(filePath, 'utf8');
    let updated = original;
    for (const [from, to] of replacements) {
      updated = updated.split(from).join(to);
    }

    if (updated !== original) {
      fs.writeFileSync(filePath, updated);
    }
  }
};
