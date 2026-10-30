import fs from 'fs';
import path from 'path';

import { getAppsPath } from './getAppsPath';
import { isDirectory } from './isDirectory';

/** The apps of the workspace: the directories under apps/ that hold a services/ directory. */
export const getAvailableAppNames = (root: string): string[] => {
  const appsPath = getAppsPath(root);

  if (!isDirectory(appsPath)) {
    return [];
  }

  return fs.readdirSync(appsPath).filter((name) => isDirectory(path.join(appsPath, name, 'services')));
};
