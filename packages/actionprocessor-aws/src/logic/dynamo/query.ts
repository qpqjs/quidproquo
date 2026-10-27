import { KvsQueryOperation, QpqPagedData } from 'quidproquo-core';

import { DynamoDBClient, QueryCommand, QueryCommandInput } from '@aws-sdk/client-dynamodb';

import { createAwsClient } from '../createAwsClient';
import { itemsToQpqPagedData } from './utils/itemsToQpqPagedData';
import { stringToLastEvaluatedKey } from './utils/stringToLastEvaluatedKey';
import { convertDynamoMapToObject } from './convertDynamoMapToObject';
import { buildDynamoQueryExpression, buildExpressionAttributeNames, buildExpressionAttributeValues } from './qpqDynamoOrm';

export async function query<Item>(
  tableName: string,
  region: string,
  keyExpression: KvsQueryOperation,
  filterExpression?: KvsQueryOperation,
  pageKey?: string,
  indexName?: string,
  limit?: number,
  sortAscending?: boolean,
  consistentRead?: boolean,
): Promise<QpqPagedData<Item>> {
  const dynamoDBClient = createAwsClient(DynamoDBClient, { region });

  const params: QueryCommandInput = {
    TableName: tableName,
    KeyConditionExpression: buildDynamoQueryExpression(keyExpression),
    FilterExpression: filterExpression && buildDynamoQueryExpression(filterExpression),
    ExpressionAttributeValues: buildExpressionAttributeValues([keyExpression, filterExpression]),
    ExpressionAttributeNames: buildExpressionAttributeNames([keyExpression, filterExpression]),
    IndexName: indexName,
    Limit: limit,
    ScanIndexForward: sortAscending,
    // Only set when asked. A strongly consistent read costs twice the RCU and cannot be served from a
    // global secondary index, so it must stay opt-in — but without it a caller cannot read back what it
    // just wrote, which some callers genuinely need.
    ConsistentRead: consistentRead,
  };

  if (pageKey) {
    params.ExclusiveStartKey = stringToLastEvaluatedKey(pageKey);
  }

  const data = await dynamoDBClient.send(new QueryCommand(params));

  const items = (data.Items || []).map((item) => convertDynamoMapToObject(item)) as Item[];

  return itemsToQpqPagedData<Item>(items, data.LastEvaluatedKey);
}
