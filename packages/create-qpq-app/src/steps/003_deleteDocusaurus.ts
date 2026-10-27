import fs from 'fs';
import path from 'path';

import { readJsonFile } from '../lib/readJsonFile';
import { writeJsonFile } from '../lib/writeJsonFile';
import { CreateQpqAppStep } from '../types';

// The docusaurus workspace is the quidproquojs.com documentation site; new
// apps don't want it. Remove the directory and its workspaces entry.
export const deleteDocusaurus: CreateQpqAppStep = {
  name: 'Removing docusaurus docs site',

  run: async ({ targetDirectory }) => {
    fs.rmSync(path.join(targetDirectory, 'docusaurus'), { recursive: true, force: true });

    const packageJsonPath = path.join(targetDirectory, 'package.json');
    const packageJson = readJsonFile(packageJsonPath);
    packageJson.workspaces = (packageJson.workspaces ?? []).filter((workspace: string) => workspace !== 'docusaurus');
    writeJsonFile(packageJsonPath, packageJson);
  },
};
