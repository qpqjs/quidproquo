import { MatchStoryResult, ScheduledEventParams } from 'quidproquo-core';

import { Context, EventBridgeEvent } from 'aws-lambda';

// Externals - The ins and outs of the external event
export type EventInput = [EventBridgeEvent<any, any>, Context];
export type EventOutput = void;

// Internals - the ins and outs of each record in the event
export type InternalEventRecord = ScheduledEventParams<any>;
export type InternalEventOutput = void;

// TODO: Get rid of {} and any types
export type MatchResult = MatchStoryResult<{}, any>;
