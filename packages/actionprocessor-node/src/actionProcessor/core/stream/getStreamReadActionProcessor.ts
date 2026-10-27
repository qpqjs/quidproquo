import { actionResult, askStreamReadBase, createActionProcessor, ProcessorFor, QPQConfig, StreamActionType } from 'quidproquo-core';

const getProcessStreamRead = (qpqConfig: QPQConfig): ProcessorFor<typeof askStreamReadBase> => {
  return async ({ streamId, noWait }, session, actionProcessors, logger, updateSession, dynamicModuleLoader, streamRegistry) => {
    const chunk = await streamRegistry.read(streamId, noWait);
    return actionResult(chunk);
  };
};

export const getStreamReadActionProcessor = createActionProcessor(askStreamReadBase, getProcessStreamRead);
