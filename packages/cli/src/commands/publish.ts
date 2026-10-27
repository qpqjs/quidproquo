// `qpq publish[:build|:upload|:deploy]` — build each backend service as a
// module-federation remote and publish it into the platform's federated code
// store, so the deployed backends federate their story code instead of running
// the bundled copy. The mechanics live in the platform driver (AWS: S3-backed,
// see platforms/aws/publish).
//
// Usage:
//   qpq publish --app docgen                    (all services)
//   qpq publish --app docgen --service template
import { getArgValue } from '../lib/args';
import { getServiceNames } from '../lib/discovery';
import { resolveAppSelection } from '../lib/resolveAppSelection';
import { resolveDeployment } from '../lib/resolveDeployment';
import { getPlatformDriver, QpqPlatformDriver } from '../platforms';

type PublishSelection = {
  driver: QpqPlatformDriver;
  appName: string;
  serviceNames: string[];
};

const resolvePublishSelection = async (argv: string[]): Promise<PublishSelection> => {
  const appName = await resolveAppSelection({ argv, envVar: 'DEPLOY_APP_NAME' });
  const { deployment } = await resolveDeployment(argv, appName);

  const requestedService = getArgValue(argv, '--service');
  const serviceNames = requestedService ? [requestedService] : getServiceNames(appName);

  return { driver: getPlatformDriver(deployment.platform), appName, serviceNames };
};

export const publishCommand = async (argv: string[]): Promise<void> => {
  const { driver, appName, serviceNames } = await resolvePublishSelection(argv);
  await driver.publish(appName, serviceNames);
};

export const publishBuildCommand = async (argv: string[]): Promise<void> => {
  const { driver, appName, serviceNames } = await resolvePublishSelection(argv);
  await driver.publishBuild(appName, serviceNames);
};

export const publishUploadCommand = async (argv: string[]): Promise<void> => {
  const { driver, appName, serviceNames } = await resolvePublishSelection(argv);
  await driver.publishUpload(appName, serviceNames);
};

export const publishDeployCommand = async (argv: string[]): Promise<void> => {
  const { driver, appName, serviceNames } = await resolvePublishSelection(argv);
  await driver.publishDeploy(appName, serviceNames);
};
