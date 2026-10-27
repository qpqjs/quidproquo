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
// The SDK reports a lost race as TransactionCanceledException with a reason per
// action. A ConditionalCheckFailed reason (the key exists) is rethrown as
// ConditionalCheckFailedException and a TransactionConflict reason (another
// write holds the item for the moment) as TransactionConflictException, the same
// names the single-item PutItem raises, so the processors' error maps key on one
// name each. Exists wins when both appear: it is final. Every other reason
// (throttle, validation) is rethrown untouched.
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
      const reasons = cancellationReasons(error);

      if (reasons.includes('ConditionalCheckFailed')) {
        throw new ConditionalCheckFailedException(`Conditional batch write to [${tableName}] lost to an existing item`);
      }
      if (reasons.includes('TransactionConflict')) {
        throw new TransactionConflictException(`Conditional batch write to [${tableName}] raced another write on one of its items`);
      }
      throw error;
    }
  }
}

/** Same name the single-item PutItem path throws on a failed condition. */
export class ConditionalCheckFailedException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConditionalCheckFailedException';
  }
}

/** Same name the single-item PutItem path throws when a transaction holds the item. */
export class TransactionConflictException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransactionConflictException';
  }
}

type TransactionCancelledLike = {
  name?: string;
  CancellationReasons?: { Code?: string }[];
};

const cancellationReasons = (error: unknown): string[] => {
  const cancelled = error as TransactionCancelledLike;

  if (cancelled?.name !== 'TransactionCanceledException') {
    return [];
  }

  return (cancelled.CancellationReasons ?? []).map((reason) => reason.Code ?? '');
};
