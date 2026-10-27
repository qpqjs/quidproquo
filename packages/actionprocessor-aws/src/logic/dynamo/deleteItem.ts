import { KvsCoreDataType } from 'quidproquo-core';

import { DeleteItemCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';

import { createAwsClient } from '../createAwsClient';
import { buildDynamoKey } from './utils/buildDynamoKey';

export async function deleteItem(
  tableName: string,
  region: string,
  key: KvsCoreDataType,
  keyName: string,
  sortKey?: KvsCoreDataType,
  sortKeyName?: string,
): Promise<void> {
  const dynamoDBClient = createAwsClient(DynamoDBClient, { region });

  await dynamoDBClient.send(
    new DeleteItemCommand({
      TableName: tableName,
      Key: buildDynamoKey(keyName, key, sortKeyName, sortKey),
    }),
  );
}
