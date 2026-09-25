import { QpqPlatformDriver } from '../types';
import { dockerGo } from './go';

const publishNotSupported = async (): Promise<void> => {
  console.error('The docker platform has no federated code store — story code is baked into the image. Rebuild with qpq go instead.');
  process.exit(1);
};

export const dockerPlatformDriver: QpqPlatformDriver = {
  // The docker platform needs no deploy identity — everything runs in-image.
  prepareDeployment: () => {},

  go: dockerGo,

  publish: publishNotSupported,
  publishBuild: publishNotSupported,
  publishUpload: publishNotSupported,
  publishDeploy: publishNotSupported,
};
