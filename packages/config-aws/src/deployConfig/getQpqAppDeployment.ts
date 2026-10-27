import { QpqAppDeployment } from 'quidproquo-core';

import { getQpqAppDeployConfig } from './getQpqAppDeployConfig';
import { getQpqAppDeployConfigPath } from './getQpqAppDeployConfigPath';

/** The named entry of the app's deploy.config.json; throws listing the configured names when absent. */
export const getQpqAppDeployment = (root: string, appName: string, deploymentName: string): QpqAppDeployment => {
  const { deployments } = getQpqAppDeployConfig(root, appName);
  const deployment = deployments[deploymentName];

  if (!deployment) {
    throw new Error(
      `No deployment '${deploymentName}' in ${getQpqAppDeployConfigPath(root, appName)}. Configured: ${Object.keys(deployments).join(', ')}`,
    );
  }

  return deployment;
};
