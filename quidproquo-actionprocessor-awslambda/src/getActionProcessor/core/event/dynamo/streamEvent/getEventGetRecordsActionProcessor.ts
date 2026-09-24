import {
  actionResult,
  askEventGetRecordsBase,
  createActionProcessor,
  EventActionType,
  KvsStreamEventType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { DynamoDBRecord } from 'aws-lambda';
import { AttributeValue } from '@aws-sdk/client-dynamodb';

import { convertDynamoMapToObject } from '../../../../../logic/dynamo/convertDynamoMapToObject';
import { decomposeScopedKvsValue } from '../../../../../logic/dynamo/scope';
import { EventInput, GLOBAL_KVS_STREAM_COALESCE, GLOBAL_KVS_STREAM_PARTITION_KEY, GLOBAL_KVS_STREAM_STORE_NAME, InternalEventRecord } from './types';

// aws-lambda types the stream images with its own AttributeValue shape; the marshaller is
// the SDK's. Structurally identical, so this is a lens rather than a conversion.
const toObject = (image?: Record<string, unknown>) =>
  image ? (convertDynamoMapToObject(image as Record<string, AttributeValue>) as Record<string, unknown>) : undefined;

// Switch on the closed union aws-lambda declares, not on `string`. Exhausting it means a
// stream event type we do not handle is a COMPILE error here, rather than a `default` branch
// quietly folding it into Modify — which for a REMOVE would report a delete as an edit.
const toEventType = (eventName: DynamoDBRecord['eventName']): KvsStreamEventType => {
  switch (eventName) {
    case 'INSERT':
      return KvsStreamEventType.Insert;
    case 'MODIFY':
      return KvsStreamEventType.Modify;
    case 'REMOVE':
      return KvsStreamEventType.Remove;
    case undefined:
      // DynamoDB always sets this; its absence means a malformed record. Failing is right:
      // the alternative is guessing, and every guess here misreports what happened to the item.
      throw new Error('DynamoDB stream record has no eventName');
  }
};

// Put the raw partition key back on an image, so nothing downstream ever sees the composed
// form. Mirrors what the scoped translator's `strip` does for an ordinary read.
const stripScope = (image: Record<string, unknown> | undefined, rawPartitionKey: string): Record<string, unknown> | undefined =>
  image && GLOBAL_KVS_STREAM_PARTITION_KEY ? { ...image, [GLOBAL_KVS_STREAM_PARTITION_KEY]: rawPartitionKey } : image;

const toInternalRecord = (record: DynamoDBRecord): InternalEventRecord => {
  const keys = toObject(record.dynamodb?.Keys) ?? {};

  // The stored partition key carries the scope; split it once here so every consumer gets a
  // raw key plus an explicit scope, and none of them has to know the composition format.
  const composedPartitionKey = GLOBAL_KVS_STREAM_PARTITION_KEY ? String(keys[GLOBAL_KVS_STREAM_PARTITION_KEY] ?? '') : '';
  const { scope, rawValue } = decomposeScopedKvsValue(composedPartitionKey);

  return {
    keyValueStoreName: GLOBAL_KVS_STREAM_STORE_NAME,
    eventType: toEventType(record.eventName),
    scope,
    keys: GLOBAL_KVS_STREAM_PARTITION_KEY ? { ...keys, [GLOBAL_KVS_STREAM_PARTITION_KEY]: rawValue } : keys,
    newImage: stripScope(toObject(record.dynamodb?.NewImage), rawValue),
    oldImage: stripScope(toObject(record.dynamodb?.OldImage), rawValue),
  };
};

// Keep the LAST record for each partition key, preserving the batch's order of first
// appearance. Last rather than first because a projection wants the newest state, and a
// handler that re-derives from source only needs to be told the key changed once.
//
// The stream guarantees ordering within a partition key, so "last in the batch" is genuinely
// the most recent change, not an arbitrary pick.
//
// Grouped by SCOPE AND key, not key alone: keys are raw by this point, so two tenants can
// legitimately hold the same id, and collapsing on the raw key would drop one tenant's change
// on the floor because another tenant touched the same id in the same batch.
const coalesceByPartitionKey = (records: InternalEventRecord[]): InternalEventRecord[] => {
  if (!GLOBAL_KVS_STREAM_PARTITION_KEY) {
    return records;
  }

  const latest = new Map<string, InternalEventRecord>();

  for (const record of records) {
    latest.set(`${record.scope ?? ''}\u0000${String(record.keys[GLOBAL_KVS_STREAM_PARTITION_KEY])}`, record);
  }

  return [...latest.values()];
};

const getProcessGetRecords = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventGetRecordsBase> => {
  return async ({ eventParams }) => {
    // Registered for one event source only, so the base requester's
    // source-agnostic payload is narrowed to this source's types here.
    const [streamEvent] = eventParams as EventInput;

    const records = streamEvent.Records.map(toInternalRecord);

    return actionResult(GLOBAL_KVS_STREAM_COALESCE ? coalesceByPartitionKey(records) : records);
  };
};

export const getEventGetRecordsActionProcessor = createActionProcessor(askEventGetRecordsBase, getProcessGetRecords);
