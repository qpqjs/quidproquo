import { KvsCoreDataType, Nullable } from 'quidproquo-core';

import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';

import { createAwsClient } from '../createAwsClient';
import { buildDynamoKey } from './utils/buildDynamoKey';
import { convertDynamoMapToObject } from './convertDynamoMapToObject';

export async function getItem(
  tableName: string,
  region: string,
  keyName: string,
  key: KvsCoreDataType,
  sortKeyName?: string,
  sortKey?: KvsCoreDataType,
): Promise<Nullable<Record<string, unknown>>> {
  const dynamoDBClient = createAwsClient(DynamoDBClient, { region });

  const result = await dynamoDBClient.send(
    new GetItemCommand({
      TableName: tableName,
      Key: buildDynamoKey(keyName, key, sortKeyName, sortKey),
    }),
  );

  return result.Item ? convertDynamoMapToObject(result.Item) : null;
}
