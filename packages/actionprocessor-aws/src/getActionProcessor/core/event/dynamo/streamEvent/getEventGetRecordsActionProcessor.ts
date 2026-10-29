import { actionResult, askEventGetRecordsBase, createActionProcessor, KvsStreamEventType, ProcessorFor } from '@qpqjs/core';

import { DynamoDBRecord } from 'aws-lambda';
import { AttributeValue } from '@aws-sdk/client-dynamodb';

import { convertDynamoMapToObject } from '../../../../../logic/dynamo/convertDynamoMapToObject';
import { decomposeScopedKvsValue, stripScopedKvsIndexAttributes } from '../../../../../logic/dynamo/scope';
import { KvsStreamLambdaSettings } from '../../../../../runtimeConfig/KvsStreamLambdaSettings';
import { EventInput, InternalEventRecord } from './types';

// aws-lambda types the stream images with its own AttributeValue shape; the marshaller is
// the SDK's. Structurally identical, so this is a lens rather than a conversion.
const toObject = (image?: Record<string, unknown>) =>
  image ? (convertDynamoMapToObject(image as Record<string, AttributeValue>) as Record<string, unknown>) : undefined;

// Switch on the closed union aws-lambda declares, not on `string`. Exhausting it means a
// stream event type we do not handle is a COMPILE error here, rather than a `default` branch
// quietly folding it into Modify, which for a REMOVE would report a delete as an edit.
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

// Put the raw partition key back on an image and drop a scoped row's hidden index copies, so
// nothing downstream ever sees the stored form. Mirrors the scoped translator's `strip`.
const stripScope = (
  image: Record<string, unknown> | undefined,
  rawPartitionKey: string,
  scope: string | undefined,
  partitionKey: string,
): Record<string, unknown> | undefined => {
  if (!image || !partitionKey) {
    return image;
  }

  const rawImage = { ...image, [partitionKey]: rawPartitionKey };
  return scope === undefined ? rawImage : stripScopedKvsIndexAttributes(rawImage);
};

const toInternalRecord = (record: DynamoDBRecord, { keyValueStoreName, partitionKey }: KvsStreamLambdaSettings): InternalEventRecord => {
  const keys = toObject(record.dynamodb?.Keys) ?? {};

  // The stored partition key carries the scope; split it once here so every consumer gets a
  // raw key plus an explicit scope, and none of them has to know the composition format.
  const composedPartitionKey = partitionKey ? String(keys[partitionKey] ?? '') : '';
  const { scope, rawValue } = decomposeScopedKvsValue(composedPartitionKey);

  return {
    keyValueStoreName,
    eventType: toEventType(record.eventName),
    scope,
    keys: partitionKey ? { ...keys, [partitionKey]: rawValue } : keys,
    newImage: stripScope(toObject(record.dynamodb?.NewImage), rawValue, scope, partitionKey),
    oldImage: stripScope(toObject(record.dynamodb?.OldImage), rawValue, scope, partitionKey),
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
const coalesceByPartitionKey = (records: InternalEventRecord[], partitionKey: string): InternalEventRecord[] => {
  if (!partitionKey) {
    return records;
  }

  const latest = new Map<string, InternalEventRecord>();

  for (const record of records) {
    latest.set(`${record.scope ?? ''}\u0000${String(record.keys[partitionKey])}`, record);
  }

  return [...latest.values()];
};

const getProcessGetRecords = (settings: KvsStreamLambdaSettings): ProcessorFor<typeof askEventGetRecordsBase> => {
  return async ({ eventParams }) => {
    // Registered for one event source only, so the base requester's
    // source-agnostic payload is narrowed to this source's types here.
    const [streamEvent] = eventParams as EventInput;

    const records = streamEvent.Records.map((record) => toInternalRecord(record, settings));

    return actionResult(settings.coalesceByPartitionKey ? coalesceByPartitionKey(records, settings.partitionKey) : records);
  };
};

/** The stream the lambda serves comes from the handler, which reads its settings from the lambda environment once. */
export const getEventGetRecordsActionProcessor = (settings: KvsStreamLambdaSettings) =>
  createActionProcessor(askEventGetRecordsBase, () => getProcessGetRecords(settings));
