import { actionResult, askEventGetStorySessionBase, createActionProcessor, EventActionType, ProcessorFor, QPQConfig } from 'quidproquo-core';

import { EventInput, InternalEventRecord, MatchResult } from './types';

// A stream record carries no caller identity — the change already happened, under whatever
// authority wrote it. The handler runs with a blank session, like the storage drive event.
const getProcessGetStorySession = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventGetStorySessionBase> => {
  return async ({ qpqEventRecord, eventParams }) => {
    return actionResult(void 0);
  };
};

export const getEventGetStorySessionActionProcessor = createActionProcessor(askEventGetStorySessionBase, getProcessGetStorySession);
