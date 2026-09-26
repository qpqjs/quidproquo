import path from 'path';

import { readJsonFile } from '../lib/readJsonFile';
import { writeJsonFile } from '../lib/writeJsonFile';
import { CreateQpqAppStep } from '../types';

// quidproquojs.com lives beside the quidproquo monorepo and consumes it via
// file:../ refs; a generated app lives anywhere, so those become registry
// versions pinned to create-qpq-app's own version; the whole family is
// published in lockstep, so the versions always exist together.
export const pinRegistryVersions: CreateQpqAppStep = {
  name: 'Pinning quidproquo versions',

  run: async ({ targetDirectory, ownVersion }) => {
    const packageJsonPath = path.join(targetDirectory, 'package.json');
    const packageJson = readJsonFile(packageJsonPath);

    for (const dependencyBlock of [packageJson.dependencies, packageJson.devDependencies]) {
      for (const [name, version] of Object.entries(dependencyBlock ?? {})) {
        if (name.startsWith('quidproquo') && String(version).startsWith('file:')) {
          dependencyBlock[name] = ownVersion;
        }
      }
    }

    writeJsonFile(packageJsonPath, packageJson);
  },
};
