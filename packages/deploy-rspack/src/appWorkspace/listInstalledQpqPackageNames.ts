import { QPQ_PACKAGE_SCOPE } from '@qpqjs/core';

import fs from 'fs';
import path from 'path';

/** The framework packages installed in a node_modules folder: the `quidproquo` umbrella plus everything under the @qpqjs scope. */
export const listInstalledQpqPackageNames = (nodeModulesDir: string): string[] => {
  const scopeDir = path.join(nodeModulesDir, QPQ_PACKAGE_SCOPE);
  const scoped = fs.existsSync(scopeDir)
    ? fs
        .readdirSync(scopeDir)
        .filter((name) => !name.startsWith('.'))
        .map((name) => `${QPQ_PACKAGE_SCOPE}/${name}`)
    : [];

  return fs.existsSync(path.join(nodeModulesDir, 'quidproquo')) ? ['quidproquo', ...scoped] : scoped;
};
