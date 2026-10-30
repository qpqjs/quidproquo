import { KvsStreamEventResponse, KvsStreamRecord, MatchStoryResult } from '@qpqjs/core';

import { Context, DynamoDBStreamEvent } from 'aws-lambda';

// Externals: the ins and outs of the external event
export type EventInput = [DynamoDBStreamEvent, Context];
export type EventOutput = void;

// Internals: the ins and outs of each record in the event
export type InternalEventRecord = KvsStreamRecord;
export type InternalEventOutput = KvsStreamEventResponse;

export type MatchResult = MatchStoryResult<any, any>;
