import { awsNamingUtils } from 'quidproquo-actionprocessor-awslambda';
import { QPQConfig, qpqCoreUtils } from 'quidproquo-core';
import { qpqWebServerUtils } from 'quidproquo-webserver';

import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';

import { SetupCheckResult, SetupStep } from '../../../lib/setupStep';
import { AwsSetupContext } from './awsSetupContext';

// Every bucket a service deploy creates, named the way the constructs name them.
const getServiceBucketNames = (qpqConfig: QPQConfig): string[] => [
  ...qpqCoreUtils
    .getOwnedItems(qpqCoreUtils.getStorageDrives(qpqConfig), qpqConfig)
    .map((drive) => awsNamingUtils.getConfigRuntimeResourceNameFromConfig(drive.storageDrive, qpqConfig)),
  ...qpqWebServerUtils
    .getWebEntryConfigs(qpqConfig)
    .filter((webEntry) => !webEntry.storageDrive.sourceStorageDrive)
    .map((webEntry) => awsNamingUtils.getQpqRuntimeResourceNameFromConfig(webEntry.name, qpqConfig, 'we')),
];

type BucketOwner = 'free' | 'ours' | 'other';

// HeadBucket: 404 means free, 200 ours, 403 exists in another account.
const getBucketOwner = async (client: S3Client, bucketName: string): Promise<BucketOwner> => {
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucketName }));
    return 'ours';
  } catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (status === 404) {
      return 'free';
    }
    if (status === 403 || status === 301) {
      return 'other';
    }
    throw error;
  }
};

// S3 bucket names are global and the framework names them from app, service and
// environment alone, so a second account cannot reuse a name the first still holds.
const checkBucketNames = async (ctx: AwsSetupContext): Promise<SetupCheckResult> => {
  const names = [...new Set(ctx.serviceQpqConfigs.flatMap(getServiceBucketNames))];
  const client = new S3Client({ region: ctx.region });

  const taken: string[] = [];
  let ours = 0;
  for (const name of names) {
    const owner = await getBucketOwner(client, name);
    if (owner === 'other') taken.push(name);
    if (owner === 'ours') ours += 1;
  }

  return taken.length === 0
    ? { done: true, detail: `${names.length} bucket name(s) available or already ours (${ours} existing)` }
    : { done: false, detail: `held by another account: ${taken.join(', ')}; delete them there or change the app prefix` };
};

/** Check-only: no bucket the deploy will create is already taken by another AWS account. */
export const buildBucketNamesStep = (ctx: AwsSetupContext): SetupStep => ({
  id: 'bucket-names',
  name: 'S3 bucket names available',
  check: () => checkBucketNames(ctx),
  run: async () => {
    const result = await checkBucketNames(ctx);
    if (!result.done) {
      throw new Error(result.detail ?? 'bucket names taken');
    }
  },
});
