import { actionResult, askGuidNew, createActionProcessor, generateUuid, ProcessorFor, QPQConfig } from '@qpqjs/core';

const getProcessGuidNew = (qpqConfig: QPQConfig): ProcessorFor<typeof askGuidNew> => {
  return async () => {
    return actionResult(generateUuid());
  };
};

export const getGuidNewActionProcessor = createActionProcessor(askGuidNew, getProcessGuidNew);
