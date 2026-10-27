import { actionResult, askRandomNumber, createActionProcessor, ProcessorFor, QPQConfig } from 'quidproquo-core';

const getProcessMathRandomNumber = (qpqConfig: QPQConfig): ProcessorFor<typeof askRandomNumber> => {
  return async () => {
    return actionResult(Math.random());
  };
};

export const getMathRandomNumberActionProcessor = createActionProcessor(askRandomNumber, getProcessMathRandomNumber);
