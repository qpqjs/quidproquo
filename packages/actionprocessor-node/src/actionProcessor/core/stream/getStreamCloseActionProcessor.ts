import { actionResult, askStreamClose, createActionProcessor, ProcessorFor, QPQConfig, StreamActionType } from 'quidproquo-core';

const getProcessStreamClose = (qpqConfig: QPQConfig): ProcessorFor<typeof askStreamClose> => {
  return async ({ streamId }, session, actionProcessors, logger, updateSession, dynamicModuleLoader, streamRegistry) => {
    streamRegistry.close(streamId);
    return actionResult(undefined);
  };
};

export const getStreamCloseActionProcessor = createActionProcessor(askStreamClose, getProcessStreamClose);
