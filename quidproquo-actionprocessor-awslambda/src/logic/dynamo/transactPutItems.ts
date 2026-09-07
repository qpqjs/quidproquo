import { KvsObjectDataType } from 'quidproquo-core';

import { DynamoDBClient, TransactWriteItemsCommand } from '@aws-sdk/client-dynamodb';

import { createAwsClient } from '../createAwsClient';
import { convertObjectToDynamoItem } from './qpqDynamoOrm';

// TransactWriteItems accepts at most 100 actions per call.
const TRANSACT_WRITE_MAX_ITEMS = 100;

// Conditional batched puts: every item is a Put guarded by attribute_not_exists
// on the partition key, and each chunk commits atomically - one existing key
// fails the whole chunk and nothing in it lands. That is the property
// BatchWriteItem cannot give (no conditions at all), and why this exists
// alongside batchPutItems.
//
// Chunks are INDEPENDENT transactions. A batch over 100 items that fails on a
// later chunk leaves the earlier chunks committed, so callers claiming a run of
// keys must treat a thrown ConditionalCheckFailedException as "re-read and
// re-lap the whole batch" - the earlier chunks' keys are now simply taken, by
// them.
//
// The SDK reports a lost race as TransactionCanceledException with, per action,
// either a ConditionalCheckFailed reason (the key already exists) or a
// TransactionConflict reason (another write, transactional or not, holds the
// item right now). Both mean the same thing to a caller claiming keys: someone
// else got there, re-read and re-lap. Every other reason (throttle, validation)
// is rethrown untouched. Re-throwing as the same-named error the single-item
// putItem raises keeps ONE name for "conditional write lost" in the processors'
// error tables.
export async function transactPutItems(tableName: string, items: KvsObjectDataType[], partitionKeyAttribute: string, region: string): Promise<void> {
  const dynamoDBClient = createAwsClient(DynamoDBClient, { region });

  for (let offset = 0; offset < items.length; offset += TRANSACT_WRITE_MAX_ITEMS) {
    const transactItems = items.slice(offset, offset + TRANSACT_WRITE_MAX_ITEMS).map((item) => ({
      Put: {
        TableName: tableName,
        Item: convertObjectToDynamoItem(item),
        ConditionExpression: 'attribute_not_exists(#ineAttr)',
        ExpressionAttributeNames: { '#ineAttr': partitionKeyAttribute },
      },
    }));

    try {
      await dynamoDBClient.send(new TransactWriteItemsCommand({ TransactItems: transactItems }));
    } catch (error: unknown) {
      if (isLostWriteRaceCancellation(error)) {
        throw new ConditionalCheckFailedException(`Conditional batch write to [${tableName}] lost to an existing item`);
      }
      throw error;
    }
  }
}

// Same name the single-item PutItem path throws on a lost condition, so the
// processors' error maps key on one name for both.
export class ConditionalCheckFailedException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConditionalCheckFailedException';
  }
}

type TransactionCancelledLike = {
  name?: string;
  CancellationReasons?: { Code?: string }[];
};

const LOST_RACE_REASONS = ['ConditionalCheckFailed', 'TransactionConflict'];

const isLostWriteRaceCancellation = (error: unknown): boolean => {
  const cancelled = error as TransactionCancelledLike;

  return (
    cancelled?.name === 'TransactionCanceledException' &&
    !!cancelled.CancellationReasons?.some((reason) => !!reason.Code && LOST_RACE_REASONS.includes(reason.Code))
  );
};
