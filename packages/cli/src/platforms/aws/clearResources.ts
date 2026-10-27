// AWS implementation of `qpq clear-resources`: empty (never delete) the
// selected data resources. Storage drives are S3 buckets - emptied including
// every object version and delete marker, so versioned buckets come out clean
// too. Key value stores are DynamoDB tables - truncated by scanning keys only
// and batch-deleting. The stacks and the resources themselves are untouched,
// so this is the "reset my data" counterpart to `qpq teardown`.
//
// Runtime names are resolved from each service's live qpq config with the
// same naming utils the deployed runtime uses, so what gets emptied is
// exactly what the app reads and writes.
import { awsNamingUtils } from 'quidproquo-actionprocessor-awslambda';
import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import { QPQConfig, qpqCoreUtils } from 'quidproquo-core';

import {
  BatchWriteItemCommand,
  DescribeTableCommand,
  DynamoDBClient,
  ResourceNotFoundException,
  ScanCommand,
  WriteRequest,
} from '@aws-sdk/client-dynamodb';
import { DeleteObjectsCommand, ListObjectVersionsCommand, NoSuchBucket, ObjectIdentifier, S3Client } from '@aws-sdk/client-s3';

import { ClearableResource, ClearResourcesPlan } from '../../lib/clearResourcesPlan';
import { loadServiceQpqConfig } from '../../lib/qpqConfigs';
import { isAwsCredentialsValid } from './awsCredentials';

// Same resolution as the runtime's resolveStorageDriveBucketName (not exported
// from the actionprocessor package root): honour the cross-module owner and
// its resourceNameOverride.
const resolveBucketName = (drive: string, qpqConfig: QPQConfig): string => {
  const storageDriveConfig = qpqCoreUtils.getStorageDriveByName(drive, qpqConfig);

  if (!storageDriveConfig) {
    throw new Error(`Could not find storage drive config for [${drive}]`);
  }

  return awsNamingUtils.getConfigRuntimeResourceNameFromConfigWithServiceOverride(
    storageDriveConfig.owner?.resourceNameOverride || drive,
    qpqConfig,
    storageDriveConfig.owner?.module,
  );
};

// Log a progress heartbeat roughly every this-many removals, so a large
// resource visibly ticks along instead of looking hung.
const PROGRESS_EVERY = 2000;

// Empty a bucket including all versions + delete markers. Returns the number
// of objects/versions removed.
const emptyBucket = async (bucketName: string, region: string): Promise<number> => {
  const s3 = new S3Client({ region });
  let removed = 0;
  let lastReported = 0;
  let keyMarker: string | undefined;
  let versionIdMarker: string | undefined;

  do {
    const page = await s3.send(new ListObjectVersionsCommand({ Bucket: bucketName, KeyMarker: keyMarker, VersionIdMarker: versionIdMarker }));

    const objects: ObjectIdentifier[] = [...(page.Versions ?? []), ...(page.DeleteMarkers ?? [])].map((v) => ({
      Key: v.Key!,
      VersionId: v.VersionId,
    }));

    if (objects.length > 0) {
      await s3.send(new DeleteObjectsCommand({ Bucket: bucketName, Delete: { Objects: objects, Quiet: true } }));
      removed += objects.length;
    }

    if (removed - lastReported >= PROGRESS_EVERY) {
      console.log(`    ... ${removed} objects/versions so far`);
      lastReported = removed;
    }

    keyMarker = page.IsTruncated ? page.NextKeyMarker : undefined;
    versionIdMarker = page.IsTruncated ? page.NextVersionIdMarker : undefined;
  } while (keyMarker || versionIdMarker);

  return removed;
};

// Truncate a table: scan key attributes only, batch-delete 25 at a time,
// retrying unprocessed items. Returns the number of items removed.
const truncateTable = async (tableName: string, region: string): Promise<number> => {
  const dynamo = new DynamoDBClient({ region });

  const described = await dynamo.send(new DescribeTableCommand({ TableName: tableName }));
  const keyAttributes = (described.Table?.KeySchema ?? []).map((k) => k.AttributeName!);

  // Alias every key attribute - a raw name could collide with a reserved word.
  const projection = keyAttributes.map((_, i) => `#k${i}`).join(', ');
  const attributeNames = Object.fromEntries(keyAttributes.map((attribute, i) => [`#k${i}`, attribute]));

  let removed = 0;
  let lastReported = 0;
  let exclusiveStartKey: Record<string, any> | undefined;

  do {
    const page = await dynamo.send(
      new ScanCommand({
        TableName: tableName,
        ProjectionExpression: projection,
        ExpressionAttributeNames: attributeNames,
        ExclusiveStartKey: exclusiveStartKey,
      }),
    );

    const items = page.Items ?? [];

    for (let i = 0; i < items.length; i += 25) {
      let requests: WriteRequest[] = items.slice(i, i + 25).map((item) => ({ DeleteRequest: { Key: item } }));

      while (requests.length > 0) {
        const result = await dynamo.send(new BatchWriteItemCommand({ RequestItems: { [tableName]: requests } }));
        removed += requests.length;

        const unprocessed = result.UnprocessedItems?.[tableName] ?? [];
        removed -= unprocessed.length;
        requests = unprocessed;

        if (requests.length > 0) {
          // Throttled - back off briefly before retrying the leftovers.
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      }
    }

    if (removed - lastReported >= PROGRESS_EVERY) {
      console.log(`    ... ${removed} items so far`);
      lastReported = removed;
    }

    exclusiveStartKey = page.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return removed;
};

const clearResource = async (appName: string, resource: ClearableResource): Promise<void> => {
  const qpqConfig = loadServiceQpqConfig(appName, resource.service);
  const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

  if (resource.kind === 'storageDrive') {
    const bucketName = resolveBucketName(resource.resourceName, qpqConfig);
    console.log(`  emptying s3://${bucketName} ...`);
    try {
      const removed = await emptyBucket(bucketName, region);
      console.log(`  emptied s3://${bucketName} (${removed} objects/versions)`);
    } catch (error) {
      if (error instanceof NoSuchBucket) {
        console.log(`  skipped s3://${bucketName} (bucket does not exist - not deployed?)`);
        return;
      }
      throw error;
    }
    return;
  }

  // 'kvs' matches the resourceType every runtime KVS action processor passes,
  // giving the deployed '-qpqkvs' table name suffix.
  const tableName = awsNamingUtils.getKvsDynamoTableNameFromConfig(resource.resourceName, qpqConfig, 'kvs');
  console.log(`  truncating ${tableName} ...`);
  try {
    const removed = await truncateTable(tableName, region);
    console.log(`  truncated ${tableName} (${removed} items)`);
  } catch (error) {
    if (error instanceof ResourceNotFoundException) {
      console.log(`  skipped ${tableName} (table does not exist - not deployed?)`);
      return;
    }
    throw error;
  }
};

export const awsClearResources = async (appName: string, plan: ClearResourcesPlan): Promise<void> => {
  if (plan.kind === 'cancelled') {
    return;
  }

  if ((await isAwsCredentialsValid()) === false) {
    console.log('Credentials are expired or invalid.');
    return;
  }

  console.log('\nEmptying resources:');

  // Sequential on purpose: predictable output, and no burst of parallel scans
  // against provisioned-throughput tables.
  for (const resource of plan.resources) {
    await clearResource(appName, resource);
  }

  console.log('Done.');
};
