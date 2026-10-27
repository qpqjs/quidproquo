import fs from 'fs';
import path from 'path';

import { getOwnPackageRoot } from './getOwnPackageRoot';

export const getOwnVersion = (): string => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(getOwnPackageRoot(), 'package.json'), 'utf8'));
  return packageJson.version;
};
