import { QpqPlatformDriver } from '../types';
import { getDockerPlatformSettings } from './getDockerPlatformSettings';
import { dockerGo } from './go';

const publishNotSupported = async (): Promise<void> => {
  console.error('The docker platform has no federated code store — story code is baked into the image. Rebuild with qpq go instead.');
  process.exit(1);
};

export const dockerPlatformDriver: QpqPlatformDriver = {
  // No identity to prime. Mappings are only parsed here; which container ports exist depends
  // on the app's config, which is not loaded yet, so that check happens in the build.
  prepareDeployment: (deploymentName, deployment) => {
    getDockerPlatformSettings(deploymentName, deployment);
  },

  go: dockerGo,
  // A docker platform's deploy already is the containerised one, so `qpq go:docker`
  // (what a scaffolded app's `npm run deploy` runs) is the same build.
  goDocker: dockerGo,

  publish: publishNotSupported,
  publishBuild: publishNotSupported,
  publishUpload: publishNotSupported,
  publishDeploy: publishNotSupported,
};
