import { KvsStreamEventResponse, KvsStreamRecord, MatchStoryResult, QpqFunctionRuntime, StorySession } from 'quidproquo-core';

// What the local KVS backend hands the runtime after a mutating write. One record per write:
// deployed, a stream batches changes and the processor coalesces them, but locally a write is
// its own batch, so a burst costs one handler run each. Slower, never wrong, since a
// projection rebuild is idempotent either way.
export type KvsStreamMessageWithSession = {
  storySession: StorySession;

  record: KvsStreamRecord;
  runtime: QpqFunctionRuntime;
};

// Externals - The ins and outs of the external event
export type EventInput = [KvsStreamMessageWithSession];
export type EventOutput = void;

// Internals - the ins and outs of each record in the event
export type InternalEventRecord = KvsStreamRecord;
export type InternalEventOutput = KvsStreamEventResponse;

export type MatchResult = MatchStoryResult<any, any>;
