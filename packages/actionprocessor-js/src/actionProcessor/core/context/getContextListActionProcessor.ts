import { actionResult, askContextList, createActionProcessor, ProcessorFor, QPQConfig } from 'quidproquo-core';

const getProcessContextList = (qpqConfig: QPQConfig): ProcessorFor<typeof askContextList> => {
  return async (payload, session) => {
    return actionResult(session.context);
  };
};

export const getContextListActionProcessor = createActionProcessor(askContextList, getProcessContextList);
