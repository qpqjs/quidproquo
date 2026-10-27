import { KvsQueryOperation } from 'quidproquo-core';

import { AttributeValue, DynamoDBClient, ScanCommand, ScanCommandInput } from '@aws-sdk/client-dynamodb';

import { createAwsClient } from '../createAwsClient';
import { convertDynamoMapToObject } from './convertDynamoMapToObject';
import { buildDynamoQueryExpression, buildExpressionAttributeNames, buildExpressionAttributeValues } from './qpqDynamoOrm';

/** Scan every page of the table, optionally filtered, and return all items. */
export async function getAllItems(tableName: string, region: string, filterExpression?: KvsQueryOperation): Promise<Record<string, unknown>[]> {
  const dynamoDBClient = createAwsClient(DynamoDBClient, { region });

  let records: Record<string, unknown>[] = [];
  let lastEvaluatedKey: Record<string, AttributeValue> | undefined;

  do {
    const scanParams: ScanCommandInput = {
      TableName: tableName,
      FilterExpression: buildDynamoQueryExpression(filterExpression),
      ExpressionAttributeValues: filterExpression && buildExpressionAttributeValues([filterExpression]),
      ExpressionAttributeNames: filterExpression && buildExpressionAttributeNames([filterExpression]),
      ExclusiveStartKey: lastEvaluatedKey,
    };

    const result = await dynamoDBClient.send(new ScanCommand(scanParams));

    records = records.concat((result.Items || []).map((item) => convertDynamoMapToObject(item)));
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return records;
}
