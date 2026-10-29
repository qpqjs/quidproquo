import { actionResult, askEventGetStorySessionBase, createActionProcessor, ProcessorFor, QPQConfig, toCrossServiceSession } from '@qpqjs/core';

import { AnyQueueMessageWithSession, EventInput, InternalEventRecord } from './types';

const getProcessGetStorySession = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventGetStorySessionBase> => {
  return async ({ eventParams, qpqEventRecord: rawQpqEventRecord }) => {
    // Registered for one event source only, so the base requester's
    // source-agnostic payload is narrowed to this source's types here.
    const [sqsEvent] = eventParams as EventInput;
    const qpqEventRecord = rawQpqEventRecord as InternalEventRecord;

    // Find the src record and pull out the session from that if we can
    const srcRecord = sqsEvent.Records.find((r) => r.messageId === qpqEventRecord.id);
    if (srcRecord) {
      const parsedInternalEventRecord = JSON.parse(srcRecord.body) as AnyQueueMessageWithSession;
      // The body is just bytes on a queue: never let it plant local context, globals or a raw token.
      return actionResult(parsedInternalEventRecord.storySession ? toCrossServiceSession(parsedInternalEventRecord.storySession) : null);
    }

    return actionResult(null);
  };
};

export const getEventGetStorySessionActionProcessor = createActionProcessor(askEventGetStorySessionBase, getProcessGetStorySession);
