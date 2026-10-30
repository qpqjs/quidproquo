// AWS federated remote publishing, build each backend service as a
// module-federation remote and publish it into that service's federated code
// bucket (see ./remote for the three-phase mechanics).
import { CliError } from '../../lib/CliError';
import { createOutput } from '../../lib/out';
import { isAwsCredentialsValid } from './awsCredentials';
import { buildRemote, deployRemoteManifest, resolvePublishTarget, uploadRemoteVersion } from './remote';

const out = createOutput('aws:publish');

const requireAwsCredentials = async (): Promise<void> => {
  if (!(await isAwsCredentialsValid())) {
    throw new CliError('AWS credentials are not valid. Configure them and retry.');
  }
};

export const awsPublishBuild = async (appName: string, serviceNames: string[]): Promise<void> => {
  out.log(`Building federated remotes for [${appName}]: ${serviceNames.join(', ')}`);

  for (const serviceName of serviceNames) {
    await buildRemote(appName, serviceName);
  }

  out.log('Done. Next: qpq publish:upload, then qpq publish:deploy.');
};

export const awsPublishUpload = async (appName: string, serviceNames: string[]): Promise<void> => {
  await requireAwsCredentials();

  // Resolve every target up front - a missing build fails the whole step
  // before a single byte is uploaded.
  const targets = serviceNames.map((serviceName) => resolvePublishTarget(appName, serviceName));

  out.log(`Uploading federated remotes for [${appName}]: ${serviceNames.join(', ')}`);
  await Promise.all(targets.map((target) => uploadRemoteVersion(target)));

  out.log('Done. Run qpq publish:deploy to flip lambdas to the new versions.');
};

export const awsPublishDeploy = async (appName: string, serviceNames: string[]): Promise<void> => {
  await requireAwsCredentials();

  const targets = serviceNames.map((serviceName) => resolvePublishTarget(appName, serviceName));

  out.log(`Deploying federated remote manifests for [${appName}]: ${serviceNames.join(', ')}`);
  await Promise.all(targets.map((target) => deployRemoteManifest(target)));

  out.log('Done. New lambda cold starts will federate these services from S3.');
};

export const awsPublish = async (appName: string, serviceNames: string[]): Promise<void> => {
  await requireAwsCredentials();

  out.log(`Publishing federated remotes for [${appName}]: ${serviceNames.join(', ')}`);

  // 1. Build everything first - any build failure bails before any upload,
  // so the buckets never end up with a half-published set of services.
  for (const serviceName of serviceNames) {
    await buildRemote(appName, serviceName);
  }
  const targets = serviceNames.map((serviceName) => resolvePublishTarget(appName, serviceName));

  // 2. Upload all version dirs in parallel - manifests untouched, nothing live yet.
  await Promise.all(targets.map((target) => uploadRemoteVersion(target)));

  // 3. Every version dir is fully uploaded - flip the manifests, in parallel.
  await Promise.all(targets.map((target) => deployRemoteManifest(target)));

  out.log('Done. New lambda cold starts will federate these services from S3.');
};
