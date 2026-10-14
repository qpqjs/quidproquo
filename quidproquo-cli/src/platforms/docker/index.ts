import { DeployPlan } from '../../lib/deployPrompts';
import { BUILD_ONLY_FLAG, FROM_BUILD_FLAG, GoDockerMode } from '../../lib/goDockerMode';
import { QpqPlatformDriver } from '../types';
import { getDockerPlatformSettings } from './getDockerPlatformSettings';
import { dockerGo } from './go';

const publishNotSupported = async (): Promise<void> => {
  console.error('The docker platform has no federated code store — story code is baked into the image. Rebuild with qpq go instead.');
  process.exit(1);
};

// A docker platform's deploy already is the containerised one, so `qpq go:docker`
// (what a scaffolded app's `npm run deploy` runs) is the same build. The image is
// the deploy, so there is no saved build to split across two runs.
const dockerGoDocker = async (appName: string, plan: DeployPlan, mode: GoDockerMode): Promise<void> => {
  if (mode !== 'full') {
    console.error(
      `The docker platform builds and deploys in one step; ${BUILD_ONLY_FLAG} and ${FROM_BUILD_FLAG} do not apply. Run qpq go:docker without them.`,
    );
    process.exit(1);
  }

  await dockerGo(appName, plan);
};

export const dockerPlatformDriver: QpqPlatformDriver = {
  // No identity to prime. Mappings are only parsed here; which container ports exist depends
  // on the app's config, which is not loaded yet, so that check happens in the build.
  prepareDeployment: (deploymentName, deployment) => {
    getDockerPlatformSettings(deploymentName, deployment);
  },

  go: dockerGo,
  goDocker: dockerGoDocker,

  publish: publishNotSupported,
  publishBuild: publishNotSupported,
  publishUpload: publishNotSupported,
  publishDeploy: publishNotSupported,
};
