// `qpq publish[:build|:upload|:deploy]`, build each backend service as a
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
import { resolveCommandContext } from '../lib/resolveCommandContext';
import { QpqPlatformDriver } from '../platforms';

type PublishSelection = {
  driver: QpqPlatformDriver;
  appName: string;
  serviceNames: string[];
};

const resolvePublishSelection = async (argv: string[]): Promise<PublishSelection> => {
  const { appName, driver } = await resolveCommandContext(argv);

  const requestedService = getArgValue(argv, '--service');
  const serviceNames = requestedService ? [requestedService] : getServiceNames(appName);

  return { driver, appName, serviceNames };
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
