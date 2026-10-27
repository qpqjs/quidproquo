import { KvsStreamEventResponse, KvsStreamRecord, MatchStoryResult, QpqFunctionRuntime } from 'quidproquo-core';

import { Context, DynamoDBStreamEvent } from 'aws-lambda';

// Customs — the CDK stamps these onto the projector lambda, the same way the storage drive
// event lambda is told which drive it serves.
export const GLOBAL_KVS_STREAM_STORE_NAME = process.env.keyValueStoreName!;
export const GLOBAL_KVS_STREAM_RUNTIME = JSON.parse(process.env.kvsStreamEntry || '"/::"') as QpqFunctionRuntime;

// Collapse each batch to one record per partition key. See KvsStreamSettings.
export const GLOBAL_KVS_STREAM_COALESCE = process.env.kvsStreamCoalesceByPartitionKey === 'true';

// The table's partition key attribute, needed to coalesce (the stream record's `Keys` map
// carries both partition and sort key, and only the partition key identifies the item's
// ordering group).
export const GLOBAL_KVS_STREAM_PARTITION_KEY = process.env.kvsStreamPartitionKey || '';

// Externals — the ins and outs of the external event
export type EventInput = [DynamoDBStreamEvent, Context];
export type EventOutput = void;

// Internals — the ins and outs of each record in the event
export type InternalEventRecord = KvsStreamRecord;
export type InternalEventOutput = KvsStreamEventResponse;

export type MatchResult = MatchStoryResult<any, any>;
