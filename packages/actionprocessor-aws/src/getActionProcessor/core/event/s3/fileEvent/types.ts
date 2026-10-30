import { MatchStoryResult } from '@qpqjs/core';
import { StorageDriveEvent, StorageDriveEventResponse } from '@qpqjs/webserver';

import { Context, S3Event } from 'aws-lambda';

// Externals - The ins and outs of the external event
export type EventInput = [S3Event, Context];
export type EventOutput = void;

// Internals - the ins and outs of each record in the event
export type InternalEventRecord = StorageDriveEvent;
export type InternalEventOutput = StorageDriveEventResponse;

export type MatchResult = MatchStoryResult<any, any>;
