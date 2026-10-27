import { Nullable } from 'quidproquo-core';

import fs from 'fs';
import path from 'path';

/** First app under apps/ that has a services/ dir: the app-agnostic default. */
export const getDefaultAppName = (root: string): Nullable<string> => {
  const appsDir = path.join(root, 'apps');
  if (!fs.existsSync(appsDir)) return null;
  return fs.readdirSync(appsDir).find((a) => fs.existsSync(path.join(appsDir, a, 'services'))) ?? null;
};
