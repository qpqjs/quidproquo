import { EitherActionResult, MatchStoryResult, StorySession } from 'quidproquo-core';
import { ExecuteServiceFunctionEvent } from 'quidproquo-webserver';

// Customs
export type AnyExecuteServiceFunctionEventWithSession = ExecuteServiceFunctionEvent<any[]> & {
  storySession: StorySession;
  serviceName: string;
};

// Externals - The ins and outs of the external event
export type EventInput = [AnyExecuteServiceFunctionEventWithSession];
export type EventOutput = EitherActionResult<any>;

// Internals - the ins and outs of each record in the event
export type InternalEventRecord = ExecuteServiceFunctionEvent<any[]>;
export type InternalEventOutput = any;

export type MatchResult = MatchStoryResult<unknown, unknown>;
