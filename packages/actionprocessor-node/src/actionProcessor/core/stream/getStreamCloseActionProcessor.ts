import { actionResult, askStreamClose, createActionProcessor, ProcessorFor, QPQConfig } from '@qpqjs/core';

const getProcessStreamClose = (qpqConfig: QPQConfig): ProcessorFor<typeof askStreamClose> => {
  return async ({ streamId }, session, actionProcessors, logger, updateSession, dynamicModuleLoader, streamRegistry) => {
    streamRegistry.close(streamId);
    return actionResult(undefined);
  };
};

export const getStreamCloseActionProcessor = createActionProcessor(askStreamClose, getProcessStreamClose);
