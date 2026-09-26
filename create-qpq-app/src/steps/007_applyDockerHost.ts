import path from 'path';

import { readJsonFile } from '../lib/readJsonFile';
import { writeJsonFile } from '../lib/writeJsonFile';
import { CreateQpqAppStep } from '../types';

type DockerDeployment = {
  platform: string;
  environment: string;
  platformSettings?: Record<string, string>;
};

// A self-hosting box like Unraid is the expected target: x86, an appdata folder per
// deployment (so development and production never share state), images pulled from
// a registry on the LAN.
const DOCKER_ARCH = 'linux/amd64';
const getDataPath = (appName: string, environment: string): string => `/mnt/user/appdata/qpq-${appName}-${environment}`;

// Fills each docker deployment's platformSettings from the answers so the first
// `qpq go` builds, pushes and writes a compose file that runs on the host as is.
export const applyDockerHost: CreateQpqAppStep = {
  name: 'Applying docker host settings',

  run: async ({ targetDirectory, answers }) => {
    const deployConfigPath = path.join(targetDirectory, 'apps', answers.appName, 'deploy.config.json');
    const deployConfig = readJsonFile(deployConfigPath);

    for (const deployment of Object.values(deployConfig.deployments) as DockerDeployment[]) {
      if (deployment.platform !== 'docker') {
        continue;
      }

      deployment.platformSettings = {
        ...deployment.platformSettings,
        ...(answers.dockerRegistry ? { registry: answers.dockerRegistry, arch: DOCKER_ARCH } : {}),
        ...(answers.dockerHost ? { publicHost: answers.dockerHost } : {}),
        dataPath: getDataPath(answers.appName, deployment.environment),
      };
    }

    writeJsonFile(deployConfigPath, deployConfig);
  },
};
