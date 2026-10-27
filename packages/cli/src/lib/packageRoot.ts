import fs from 'fs';
import path from 'path';

// This package's root (works from src under ts-node and from lib/commonjs).
export const getOwnPackageRoot = (): string => {
  let dir = __dirname;
  while (!fs.existsSync(path.join(dir, 'package.json'))) {
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error('Could not locate the quidproquo-cli package root');
    dir = parent;
  }
  return dir;
};
