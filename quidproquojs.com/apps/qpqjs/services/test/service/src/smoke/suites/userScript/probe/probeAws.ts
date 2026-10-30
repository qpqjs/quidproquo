import { Nullable } from 'quidproquo';

import { SMOKE_PROBE_DEFAULT_CHAIN_REGION } from '../constants/SMOKE_PROBE_DEFAULT_CHAIN_REGION';
import { SmokeAwsProbeResult } from '../models/SmokeAwsProbeResult';
import { readParentCredentials } from './readParentCredentials';
import { recordAwsProbeAttempt } from './recordAwsProbeAttempt';

// Runs INSIDE the sandbox, handed to the smoke script as the `smoke-probe` module. It skips
// the framework entirely and goes at AWS with the SDK, the way a hostile script would: first
// with whatever credentials the SDK can find on its own, then with the runner's credentials
// scraped from the parent process. Every call must come back denied or without credentials;
// the host side asserts on the report. The SDK imports are lazy because declared modules
// load on every script run, including on the dev server, which has no SDK to load.
export const probeAws = async (bucket: string, key: string): Promise<SmokeAwsProbeResult> => {
  const [s3, sts, dynamo, secrets] = await Promise.all([
    import('@aws-sdk/client-s3'),
    import('@aws-sdk/client-sts'),
    import('@aws-sdk/client-dynamodb'),
    import('@aws-sdk/client-secrets-manager'),
  ]);

  const awsEnvNames = Object.keys(process.env).filter((name) => name.startsWith('AWS_'));

  const defaultChain = await recordAwsProbeAttempt('s3:ListBuckets', () =>
    new s3.S3Client({
      region: SMOKE_PROBE_DEFAULT_CHAIN_REGION,
      maxAttempts: 1,
    }).send(new s3.ListBucketsCommand({})),
  );

  const parent = readParentCredentials();
  if (!parent) {
    return {
      awsEnvNames,
      parentCredentialsFound: false,
      identity: null,
      defaultChain,
      attempts: [],
    };
  }

  const config = { ...parent, maxAttempts: 1 };
  const s3Client = new s3.S3Client(config);

  let identity: Nullable<string> = null;
  try {
    const caller = await new sts.STSClient(config).send(new sts.GetCallerIdentityCommand({}));
    identity = caller.Arn ?? null;
  } catch {
    identity = null;
  }

  const attempts = [
    await recordAwsProbeAttempt('s3:GetObject', () => s3Client.send(new s3.GetObjectCommand({ Bucket: bucket, Key: key }))),
    await recordAwsProbeAttempt('s3:PutObject', () =>
      s3Client.send(
        new s3.PutObjectCommand({
          Bucket: bucket,
          Key: `${key}.escaped`,
          Body: 'escaped',
        }),
      ),
    ),
    await recordAwsProbeAttempt('s3:ListObjectsV2', () => s3Client.send(new s3.ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 }))),
    await recordAwsProbeAttempt('s3:ListBuckets', () => s3Client.send(new s3.ListBucketsCommand({}))),
    await recordAwsProbeAttempt('dynamodb:ListTables', () => new dynamo.DynamoDBClient(config).send(new dynamo.ListTablesCommand({ Limit: 1 }))),
    await recordAwsProbeAttempt('secretsmanager:ListSecrets', () =>
      new secrets.SecretsManagerClient(config).send(new secrets.ListSecretsCommand({ MaxResults: 1 })),
    ),
  ];

  return {
    awsEnvNames,
    parentCredentialsFound: true,
    identity,
    defaultChain,
    attempts,
  };
};
