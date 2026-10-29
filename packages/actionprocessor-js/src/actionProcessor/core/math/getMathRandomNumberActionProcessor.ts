import { actionResult, askMathRandomNumber, createActionProcessor, ProcessorFor, QPQConfig } from '@qpqjs/core';

const getProcessMathRandomNumber = (qpqConfig: QPQConfig): ProcessorFor<typeof askMathRandomNumber> => {
  return async () => {
    return actionResult(Math.random());
  };
};

export const getMathRandomNumberActionProcessor = createActionProcessor(askMathRandomNumber, getProcessMathRandomNumber);
