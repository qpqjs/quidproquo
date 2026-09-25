import { QpqPlatformDriver } from '../types';
import { getDockerPlatformSettings } from './getDockerPlatformSettings';
import { dockerGo } from './go';

const publishNotSupported = async (): Promise<void> => {
  console.error('The docker platform has no federated code store — story code is baked into the image. Rebuild with qpq go instead.');
  process.exit(1);
};

export const dockerPlatformDriver: QpqPlatformDriver = {
  // No identity to prime; only the port mappings need checking before the build starts.
  prepareDeployment: (deploymentName, deployment) => {
    getDockerPlatformSettings(deploymentName, deployment);
  },

  go: dockerGo,

  publish: publishNotSupported,
  publishBuild: publishNotSupported,
  publishUpload: publishNotSupported,
  publishDeploy: publishNotSupported,
};
