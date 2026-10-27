import { KvsObjectDataType } from 'quidproquo-core';

import { BatchWriteItemCommand, DynamoDBClient, WriteRequest } from '@aws-sdk/client-dynamodb';

import { createAwsClient } from '../createAwsClient';
import { convertObjectToDynamoItem } from './qpqDynamoOrm';

// BatchWriteItem accepts at most 25 writes per call.
const BATCH_WRITE_MAX_ITEMS = 25;

// UnprocessedItems is DynamoDB's throttle back-pressure, not an error: the
// service accepted part of the batch and hands the rest back for resubmission.
// Retry with backoff; only a batch that STAYS unprocessed is a real failure.
const MAX_UNPROCESSED_RETRIES = 8;
const RETRY_BASE_DELAY_MS = 50;

// Errors are matched by NAME in the processors' error tables, so the name is
// the API. Exhausted retries mean sustained throttle — a transient fault the
// processor must classify as ServiceUnavailable, never a generic (permanent)
// failure.
export class BatchWriteUnprocessedItemsError extends Error {
  constructor(tableName: string, unprocessedCount: number, attempts: number) {
    super(`BatchWriteItem to [${tableName}] still has ${unprocessedCount} unprocessed items after ${attempts} attempts`);
    this.name = 'BatchWriteUnprocessedItemsError';
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Unconditional batched puts. No ConditionExpression exists on BatchWriteItem,
// so unlike putItem there is no ifNotExists — callers must only batch items
// whose keys are unique by construction (see askKeyValueStoreUpsertMany).
export async function batchPutItems(tableName: string, items: KvsObjectDataType[], region: string): Promise<void> {
  const dynamoDBClient = createAwsClient(DynamoDBClient, { region });

  for (let offset = 0; offset < items.length; offset += BATCH_WRITE_MAX_ITEMS) {
    let writeRequests: WriteRequest[] = items
      .slice(offset, offset + BATCH_WRITE_MAX_ITEMS)
      .map((item) => ({ PutRequest: { Item: convertObjectToDynamoItem(item) } }));

    for (let attempt = 0; writeRequests.length > 0; attempt += 1) {
      if (attempt > MAX_UNPROCESSED_RETRIES) {
        throw new BatchWriteUnprocessedItemsError(tableName, writeRequests.length, attempt);
      }

      if (attempt > 0) {
        await delay(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
      }

      const response = await dynamoDBClient.send(
        new BatchWriteItemCommand({
          RequestItems: { [tableName]: writeRequests },
        }),
      );

      writeRequests = response.UnprocessedItems?.[tableName] ?? [];
    }
  }
}
