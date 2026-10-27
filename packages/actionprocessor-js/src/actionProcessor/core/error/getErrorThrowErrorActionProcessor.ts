import { actionResultError, askThrowErrorBase, createActionProcessor, ErrorActionType, ProcessorFor, QPQConfig } from 'quidproquo-core';

const getProcessErrorThrowError = (qpqConfig: QPQConfig): ProcessorFor<typeof askThrowErrorBase> => {
  return async ({ errorStack, errorText, errorType }) => {
    return actionResultError(errorType, errorText, errorStack);
  };
};

export const getErrorThrowErrorActionProcessor = createActionProcessor(askThrowErrorBase, getProcessErrorThrowError);
