import fs from 'fs';
import path from 'path';

import { listFilesRecursive } from '../lib/listFilesRecursive';
import { CreateQpqAppStep } from '../types';

// npm strips .gitignore files from published tarballs, so the snapshot stores
// them dotless (the create-react-app trick); restore the dots here.
export const restoreGitignore: CreateQpqAppStep = {
  name: 'Restoring .gitignore files',

  run: async ({ targetDirectory }) => {
    for (const filePath of listFilesRecursive(targetDirectory)) {
      if (path.basename(filePath) === 'gitignore') {
        fs.renameSync(filePath, path.join(path.dirname(filePath), '.gitignore'));
      }
    }
  },
};
