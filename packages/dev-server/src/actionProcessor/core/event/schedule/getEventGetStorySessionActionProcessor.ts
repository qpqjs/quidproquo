import { actionResult, askEventGetStorySessionBase, createActionProcessor, ProcessorFor, QPQConfig } from '@qpqjs/core';

const getProcessGetStorySession = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventGetStorySessionBase> => {
  return async () => {
    return actionResult(undefined);
  };
};

export const getEventGetStorySessionActionProcessor = createActionProcessor(askEventGetStorySessionBase, getProcessGetStorySession);
