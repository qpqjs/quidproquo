import fs from 'fs';
import path from 'path';

import { readJsonFile } from '../lib/readJsonFile';
import { replaceInFiles } from '../lib/replaceInFiles';
import { writeJsonFile } from '../lib/writeJsonFile';
import { CreateQpqAppStep } from '../types';

// Give the app its identity. Only targeted, collision-free tokens are
// rewritten: the app FOLDER, the package SCOPE and each deployment's NAME take
// the app name, while template vocabulary (TodoServiceEnum, services/todo,
// TodoList, TODO comments) is deliberately left alone so every generated app
// shares the same internal layout.
export const applyAppIdentity: CreateQpqAppStep = {
  name: 'Applying app identity',

  run: async ({ targetDirectory, answers }) => {
    const { appName } = answers;

    const todoAppDirectory = path.join(targetDirectory, 'apps', 'todo');
    const appDirectory = path.join(targetDirectory, 'apps', appName);
    if (appName !== 'todo') {
      fs.renameSync(todoAppDirectory, appDirectory);
    }

    replaceInFiles(targetDirectory, [
      // Workspace package scope: @todo/constants -> @myapp/constants
      ['@todo/', `@${appName}/`],
      // Build/dist and federated-alias paths: dist/apps/todo/... -> dist/apps/myapp/...
      ['apps/todo/', `apps/${appName}/`],
    ]);

    // A deployment's name prefixes every stack/resource; service configs read it
    // from the primed APPLICATION_NAME, so the JSON is the only place it's set.
    const deployConfigPath = path.join(targetDirectory, 'apps', appName, 'deploy.config.json');
    const deployConfig = readJsonFile(deployConfigPath);
    for (const deployment of Object.values(deployConfig.deployments) as { name: string }[]) {
      deployment.name = appName;
    }
    writeJsonFile(deployConfigPath, deployConfig);

    const rootPackageJsonPath = path.join(targetDirectory, 'package.json');
    const rootPackageJson = readJsonFile(rootPackageJsonPath);
    rootPackageJson.name = appName;
    writeJsonFile(rootPackageJsonPath, rootPackageJson);
  },
};
