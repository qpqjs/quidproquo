// Build a backend service as a module-federation remote and publish it into the
// shared federated-code storage drive, under the service's own prefix. After this
// runs, the already-deployed lambdas load their stories from the bucket (quidproquo's
// dynamicModuleLoader tries the federated store first, falls back to the bundled
// code when nothing's published).
//
// The store is one storage drive shared across services (via `owner`). Each service
// opts in with defineFederatedModuleStore(<driveName>) and its lambdas read from
// s3://<bucket>/<service>. Read access comes from the storage drive's own grants, so
// the drive + a deploy of each service must exist before publishing. The bucket name
// resolves from the same service config the deploy used, so it always matches.
//
// Publishing is split into three phases so they can run as separate commands
// (publish:build / publish:upload / publish:deploy) or chained by `qpq publish`:
//   buildRemote          - rspack the remote + lay out service-remote-published/
//   uploadRemoteVersion  - sync the hashed version dir (everything BUT manifest.json)
//   deployRemoteManifest - upload manifest.json, atomically flipping lambdas over
// Version files always land before the manifest that references them, so a reading
// lambda never sees a manifest whose files aren't all present yet.
import { awsNamingUtils } from '@qpqjs/actionprocessor-aws';
import { qpqCoreUtils } from '@qpqjs/core';
import { getServiceRemoteRspackConfig, publishFederatedRemote, runRspack } from '@qpqjs/deploy-rspack';

import fs from 'fs';
import path from 'path';

import { getRoot, getServiceDirectory } from '../../lib/discovery';
import { loadServiceQpqConfig } from '../../lib/qpqConfigs';
import { runCommand } from '../../lib/runCommand';

// Everything the upload/deploy phases need to publish a built remote. Resolved
// from the on-disk build output + service config, so each phase can run in its
// own process without handing state between commands.
export type RemotePublishTarget = {
  serviceName: string;
  publishPath: string;
  manifestHash: string;
  bucketName: string;
  servicePrefix: string;
};

const getPublishPath = (appName: string, serviceName: string): string =>
  path.join(getRoot(), 'dist', 'apps', appName, 'services', serviceName, 'service-remote-published');

// Resolve the shared store bucket from the service's defineFederatedModuleStore
// setting (same derivation the lambda env var uses) and the per-service prefix
// so many services share one bucket.
const resolveRemoteStore = (appName: string, serviceName: string): { bucketName: string; servicePrefix: string } => {
  const qpqConfig = loadServiceQpqConfig(appName, serviceName);

  const federatedStore = qpqCoreUtils.getFederatedModuleStore(qpqConfig);
  if (!federatedStore) {
    throw new Error(
      `service [${serviceName}] has no defineFederatedModuleStore(...) - add it (and the matching storage drive) to opt into federation`,
    );
  }
  const storageDrive = qpqCoreUtils.getStorageDriveByName(federatedStore.storageDrive, qpqConfig);
  if (!storageDrive) {
    throw new Error(
      `defineFederatedModuleStore references storage drive [${federatedStore.storageDrive}] which service [${serviceName}] does not declare`,
    );
  }
  const bucketName = awsNamingUtils.resolveConfigRuntimeResourceNameFromConfig(
    storageDrive.owner?.resourceNameOverride || storageDrive.storageDrive,
    qpqConfig,
    storageDrive.owner,
  );
  const servicePrefix = qpqCoreUtils.getApplicationModuleName(qpqConfig);

  return { bucketName, servicePrefix };
};

// Phase 1: rspack the federated remote container and lay out the publishable
// version dir + manifest.json under service-remote-published/. Validates the
// federation config up front so a misconfigured service fails before the build.
export const buildRemote = async (appName: string, serviceName: string): Promise<void> => {
  resolveRemoteStore(appName, serviceName);

  const serviceDir = path.join(getServiceDirectory(appName, serviceName), 'service');
  const qpqConfig = loadServiceQpqConfig(appName, serviceName);

  console.log(`Building federated remote: [${serviceName}]`);
  const config = getServiceRemoteRspackConfig(qpqConfig, serviceDir);
  await runRspack(config);

  const remoteBuildPath = config.output!.path as string;
  publishFederatedRemote(qpqConfig, remoteBuildPath, getPublishPath(appName, serviceName));
};

// Resolve a publish target from a prior buildRemote's on-disk output.
export const resolvePublishTarget = (appName: string, serviceName: string): RemotePublishTarget => {
  const publishPath = getPublishPath(appName, serviceName);
  const manifestPath = path.join(publishPath, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`no built remote found for [${serviceName}] (missing ${manifestPath}) - run \`qpq publish:build --app ${appName}\` first`);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as {
    hash: string;
  };

  return {
    serviceName,
    publishPath,
    manifestHash: manifest.hash,
    ...resolveRemoteStore(appName, serviceName),
  };
};

// Phase 2: upload the hashed version dir - everything EXCEPT manifest.json, so
// nothing referenced by a live manifest changes. Safe to run concurrently across
// services - each writes only under its own prefix.
export const uploadRemoteVersion = async (target: RemotePublishTarget): Promise<void> => {
  const { serviceName, publishPath, manifestHash, bucketName, servicePrefix } = target;

  console.log(`Uploading [${serviceName}] version [${manifestHash}] to [s3://${bucketName}/${servicePrefix}/${manifestHash}]`);
  await runCommand('aws', ['s3', 'sync', path.join(publishPath, manifestHash), `s3://${bucketName}/${servicePrefix}/${manifestHash}`]);
};

// Phase 3: upload manifest.json, the pointer lambdas read - this is the moment
// the new version goes live. Only run once the version dir is fully uploaded.
export const deployRemoteManifest = async (target: RemotePublishTarget): Promise<void> => {
  const { serviceName, publishPath, manifestHash, bucketName, servicePrefix } = target;

  console.log(`Deploying [${serviceName}] manifest for version [${manifestHash}] to [s3://${bucketName}/${servicePrefix}/manifest.json]`);
  await runCommand('aws', ['s3', 'cp', path.join(publishPath, 'manifest.json'), `s3://${bucketName}/${servicePrefix}/manifest.json`]);
};
