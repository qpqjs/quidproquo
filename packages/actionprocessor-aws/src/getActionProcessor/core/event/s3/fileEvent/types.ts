import { MatchStoryResult, QpqFunctionRuntime } from 'quidproquo-core';
import { StorageDriveEvent, StorageDriveEventResponse } from 'quidproquo-webserver';

import { Context, S3Event } from 'aws-lambda';

// Customs
export const GLOBAL_STORAGE_DRIVE_NAME = process.env.storageDriveName!;
// TODO: Get this from the storageDriveConfig.
export const GLOBAL_STORAGE_DRIVE_RUNTIME = JSON.parse(process.env.storageDriveEntry || '"/::"') as QpqFunctionRuntime;

// Externals - The ins and outs of the external event
export type EventInput = [S3Event, Context];
export type EventOutput = void;

// Internals - the ins and outs of each record in the event
export type InternalEventRecord = StorageDriveEvent;
export type InternalEventOutput = StorageDriveEventResponse;

export type MatchResult = MatchStoryResult<any, any>;
