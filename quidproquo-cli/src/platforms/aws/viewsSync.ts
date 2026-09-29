// Views upload to S3. Every service's views go to its prefix in the shared
// 'views' bucket (owned by shell). A service can also be a standalone host on
// its own domain: each of its web entries marked `storageDrive.syncServiceViews`
// gets the bundle at its drive's root. shell is the root website, which predates
// that flag, so it keeps its 'website' bucket root when it declares none.
import { awsNamingUtils } from 'quidproquo-actionprocessor-awslambda';
import { qpqWebServerUtils } from 'quidproquo-webserver';

import fs from 'fs';
import path from 'path';

import { loadServiceQpqConfig } from '../../lib/qpqConfigs';
import { runCommand } from '../../lib/runCommand';
import { getViewsDistDir } from '../../lib/views';

// The mutable entry points: fixed names whose CONTENT changes every deploy. They
// must never be cached without revalidation — a browser holding a stale
// mf-manifest.json or remoteEntry.js keeps running the previous deploy's bundle
// (the module-reload hot-swap and plain page refreshes both depend on these being
// fresh). Everything else in a views dist is content-hashed and safely immutable.
export const NO_CACHE_FILES = ['mf-manifest.json', 'remoteEntry.js', 'index.html', 'favicon.ico'];

export const getViewsS3Destinations = (appName: string, serviceName: string): string[] => {
  const shellConfig = loadServiceQpqConfig(appName, 'shell');
  const viewsBucketName = awsNamingUtils.getConfigRuntimeResourceNameFromConfig('views', shellConfig);

  const destinations = [`s3://${viewsBucketName}/${serviceName}`];

  const serviceConfig = serviceName === 'shell' ? shellConfig : loadServiceQpqConfig(appName, serviceName);
  const hostDrives = qpqWebServerUtils
    .getWebEntryConfigs(serviceConfig)
    .filter((webEntry) => webEntry.storageDrive.syncServiceViews && webEntry.storageDrive.sourceStorageDrive)
    .map((webEntry) => webEntry.storageDrive.sourceStorageDrive!);

  if (serviceName === 'shell' && hostDrives.length === 0) {
    hostDrives.push('website');
  }

  for (const drive of hostDrives) {
    destinations.push(`s3://${awsNamingUtils.getConfigRuntimeResourceNameFromConfig(drive, serviceConfig)}`);
  }

  return destinations;
};

export const syncViewsToS3 = async (appName: string, serviceName: string): Promise<void> => {
  const distDir = getViewsDistDir(appName, serviceName);

  for (const destination of getViewsS3Destinations(appName, serviceName)) {
    console.log(`Copying [${serviceName}] views to [${destination}]`);

    // Content-hashed assets: cache forever.
    await runCommand('aws', [
      's3',
      'sync',
      distDir,
      destination,
      '--cache-control',
      'public,max-age=31536000,immutable',
      ...NO_CACHE_FILES.flatMap((file) => ['--exclude', file]),
    ]);

    // Entry points: cp (not sync) so the no-cache header is (re)applied on every
    // deploy even when a body happens to be byte-identical.
    for (const file of NO_CACHE_FILES) {
      if (!fs.existsSync(path.join(distDir, file))) {
        continue;
      }

      await runCommand('aws', ['s3', 'cp', path.join(distDir, file), `${destination}/${file}`, '--cache-control', 'no-cache']);
    }
  }
};
