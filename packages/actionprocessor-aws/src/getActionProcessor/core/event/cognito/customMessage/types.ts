import { MatchStoryResult } from 'quidproquo-core';
import { EmailSendEvent, EmailSendEventResponse, HTTPEvent, HTTPEventResponse } from 'quidproquo-webserver';

import { Context, CustomMessageTriggerEvent } from 'aws-lambda';

export const GLOBAL_USER_DIRECTORY_NAME = process.env.userDirectoryName!;

// Externals - The ins and outs of the external event
export type EventInput = [CustomMessageTriggerEvent, Context];
export type EventOutput = CustomMessageTriggerEvent;

// Internals - the ins and outs of each record in the event
export type InternalEventRecord = EmailSendEvent;
export type InternalEventOutput = EmailSendEventResponse;

export type MatchResult = MatchStoryResult<any, any>;
