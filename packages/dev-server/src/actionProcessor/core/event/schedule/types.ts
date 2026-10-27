import { MatchStoryResult, QpqFunctionRuntime, ScheduledEventParams, StorySession } from 'quidproquo-core';

// What the local ticker hands the runtime when a schedule's minute comes up.
// One record per firing: EventBridge delivers a schedule one event at a time
// too, so there is no batch to unpack here or deployed.
export type ScheduleMessageWithSession = {
  storySession: StorySession;

  record: ScheduledEventParams<any>;
  runtime: QpqFunctionRuntime;
};

// Externals - The ins and outs of the external event
export type EventInput = [ScheduleMessageWithSession];
export type EventOutput = void;

// Internals - the ins and outs of each record in the event
export type InternalEventRecord = ScheduledEventParams<any>;
export type InternalEventOutput = void;

export type MatchResult = MatchStoryResult<{}, any>;
