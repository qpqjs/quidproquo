import { actionResult, askGetRuntimeCorrelation, createActionProcessor, ProcessorFor, QPQConfig } from 'quidproquo-core';

const getProcessSystemGetRuntimeCorrelation = (qpqConfig: QPQConfig): ProcessorFor<typeof askGetRuntimeCorrelation> => {
  return async (payload, session) => {
    return actionResult(session.correlation);
  };
};

export const getSystemGetRuntimeCorrelationActionProcessor = createActionProcessor(askGetRuntimeCorrelation, getProcessSystemGetRuntimeCorrelation);
