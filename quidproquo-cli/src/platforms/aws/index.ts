import { QpqPlatformDriver } from '../types';
import { awsClearResources } from './clearResources';
import { awsGo } from './go';
import { awsGoDocker } from './goDocker';
import { awsPrimeDeployIdentity } from './identity';
import { awsPublish, awsPublishBuild, awsPublishDeploy, awsPublishUpload } from './publish';
import { awsSetupSteps } from './setup';
import { awsTeardown } from './teardown';

export const awsPlatformDriver: QpqPlatformDriver = {
  primeDeployIdentity: awsPrimeDeployIdentity,

  go: awsGo,
  goDocker: awsGoDocker,
  teardown: awsTeardown,
  clearResources: awsClearResources,
  setupSteps: awsSetupSteps,

  publish: awsPublish,
  publishBuild: awsPublishBuild,
  publishUpload: awsPublishUpload,
  publishDeploy: awsPublishDeploy,
};
