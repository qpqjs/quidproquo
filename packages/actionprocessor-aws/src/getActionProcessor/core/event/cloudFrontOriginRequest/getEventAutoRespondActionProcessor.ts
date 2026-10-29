import { actionResult, askEventAutoRespondBase, createActionProcessor, ProcessorFor, QPQConfig } from '@qpqjs/core';

const getProcessAutoRespond = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventAutoRespondBase> => {
  return async () => {
    return actionResult(null);
  };
};

export const getEventAutoRespondActionProcessor = createActionProcessor(askEventAutoRespondBase, getProcessAutoRespond);
