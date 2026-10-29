import { actionResult, askEventGetStorySessionBase, createActionProcessor, ProcessorFor, QPQConfig } from '@qpqjs/core';

// A stream record carries no caller identity, the change already happened, under whatever
// authority wrote it. The handler runs with a blank session, like the storage drive event.
const getProcessGetStorySession = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventGetStorySessionBase> => {
  return async ({ qpqEventRecord, eventParams }) => {
    return actionResult(undefined);
  };
};

export const getEventGetStorySessionActionProcessor = createActionProcessor(askEventGetStorySessionBase, getProcessGetStorySession);
