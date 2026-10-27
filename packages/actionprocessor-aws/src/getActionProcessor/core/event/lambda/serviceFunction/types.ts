import { EitherActionResult, MatchStoryResult, StoryResult, StorySession } from 'quidproquo-core';
import { ExecuteServiceFunctionEvent } from 'quidproquo-webserver';

import { Context } from 'aws-lambda';

// Customs
export type AnyExecuteServiceFunctionEventWithSession = ExecuteServiceFunctionEvent<any[]> & {
  storySession: StorySession;
};

// Externals - The ins and outs of the external event
export type EventInput = [AnyExecuteServiceFunctionEventWithSession, Context];
export type EventOutput = EitherActionResult<any>;

// Internals - the ins and outs of each record in the event
export type InternalEventRecord = ExecuteServiceFunctionEvent<any[]>;
export type InternalEventOutput = any;

export type MatchResult = MatchStoryResult<unknown, unknown>;
