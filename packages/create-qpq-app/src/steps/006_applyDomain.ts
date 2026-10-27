import path from 'path';

import { readJsonFile } from '../lib/readJsonFile';
import { writeJsonFile } from '../lib/writeJsonFile';
import { CreateQpqAppStep } from '../types';

// The domain is a deployment setting (ROOT_DOMAINS, read by every defineDns), so
// it is set on each generated deployment. One root at scaffold time; more can
// be appended later, comma separated, primary first.
export const applyDomain: CreateQpqAppStep = {
  name: 'Applying domain',

  run: async ({ targetDirectory, answers }) => {
    const deployConfigPath = path.join(targetDirectory, 'apps', answers.appName, 'deploy.config.json');
    const deployConfig = readJsonFile(deployConfigPath);
    for (const deployment of Object.values(deployConfig.deployments) as { settings?: Record<string, string> }[]) {
      deployment.settings = { ...deployment.settings, ROOT_DOMAINS: answers.domain };
    }
    writeJsonFile(deployConfigPath, deployConfig);
  },
};
