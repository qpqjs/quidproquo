import { KvsCoreDataType, KvsQueryOperation, KvsUpdate } from '@qpqjs/core';

import { DynamoDBClient, ReturnValue, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

import { createAwsClient } from '../createAwsClient';
import { buildDynamoKey } from './utils/buildDynamoKey';
import { convertDynamoMapToObject } from './convertDynamoMapToObject';
import {
  buildDynamoQueryExpression,
  buildDynamoUpdateExpression,
  buildExpressionAttributeNames,
  buildExpressionAttributeValues,
  buildUpdateExpressionAttributeNames,
  buildUpdateExpressionAttributeValues,
} from './qpqDynamoOrm';

// Placeholders are hashed from the attribute name or the value, so the update's and the condition's maps agree
// wherever they overlap and can simply be merged. Empty maps must stay undefined: DynamoDB rejects an empty one.
const mergeExpressionMaps = <T>(...maps: (Record<string, T> | undefined)[]): Record<string, T> | undefined => {
  const merged = Object.assign({}, ...maps.filter((map) => map !== undefined));

  return Object.keys(merged).length > 0 ? merged : undefined;
};

/**
 * Apply a kvs update to one item and return the full item as stored after the update. With `condition`, the write is
 * guarded by a ConditionExpression over the stored item and a failed check throws ConditionalCheckFailedException.
 */
export async function updateItem<Item>(
  tableName: string,
  region: string,
  update: KvsUpdate,
  keyName: string,
  key: KvsCoreDataType,
  sortKeyName?: string,
  sortKey?: KvsCoreDataType,
  condition?: KvsQueryOperation,
): Promise<Item> {
  const dynamoDBClient = createAwsClient(DynamoDBClient, { region });

  const result = await dynamoDBClient.send(
    new UpdateItemCommand({
      TableName: tableName,
      Key: buildDynamoKey(keyName, key, sortKeyName, sortKey),
      UpdateExpression: buildDynamoUpdateExpression(update),
      ConditionExpression: buildDynamoQueryExpression(condition),
      ExpressionAttributeValues: mergeExpressionMaps(buildUpdateExpressionAttributeValues(update), buildExpressionAttributeValues([condition])),
      ExpressionAttributeNames: mergeExpressionMaps(buildUpdateExpressionAttributeNames(update), buildExpressionAttributeNames([condition])),
      ReturnValues: ReturnValue.ALL_NEW,
    }),
  );

  return convertDynamoMapToObject(result.Attributes) as Item;
}
