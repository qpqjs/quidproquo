import { KvsQueryOperation, QpqPagedData } from 'quidproquo-core';

import { DynamoDBClient, ScanCommand, ScanCommandInput } from '@aws-sdk/client-dynamodb';

import { createAwsClient } from '../createAwsClient';
import { itemsToQpqPagedData } from './utils/itemsToQpqPagedData';
import { stringToLastEvaluatedKey } from './utils/stringToLastEvaluatedKey';
import { convertDynamoMapToObject } from './convertDynamoMapToObject';
import { buildDynamoQueryExpression, buildExpressionAttributeNames, buildExpressionAttributeValues } from './qpqDynamoOrm';

export async function scan<Item>(
  tableName: string,
  region: string,
  filterExpression?: KvsQueryOperation,
  pageKey?: string,
): Promise<QpqPagedData<Item>> {
  const dynamoDBClient = createAwsClient(DynamoDBClient, { region });

  const params: ScanCommandInput = {
    TableName: tableName,
    FilterExpression: buildDynamoQueryExpression(filterExpression),
    ExpressionAttributeValues: filterExpression && buildExpressionAttributeValues([filterExpression]),
    ExpressionAttributeNames: filterExpression && buildExpressionAttributeNames([filterExpression]),
  };

  if (pageKey) {
    params.ExclusiveStartKey = stringToLastEvaluatedKey(pageKey);
  }

  const data = await dynamoDBClient.send(new ScanCommand(params));

  const items = (data.Items || []).map((item) => convertDynamoMapToObject(item)) as Item[];

  return itemsToQpqPagedData<Item>(items, data.LastEvaluatedKey);
}
