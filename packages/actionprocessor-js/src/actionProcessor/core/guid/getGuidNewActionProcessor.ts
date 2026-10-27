import { actionResult, askNewGuid, createActionProcessor, generateUuid, ProcessorFor, QPQConfig } from '@qpqjs/core';

const getProcessGuidNew = (qpqConfig: QPQConfig): ProcessorFor<typeof askNewGuid> => {
  return async () => {
    return actionResult(generateUuid());
  };
};

export const getGuidNewActionProcessor = createActionProcessor(askNewGuid, getProcessGuidNew);
