import { actionResult, askEventAutoRespondBase, createActionProcessor, ProcessorFor, QPQConfig } from 'quidproquo-core';

// Nothing is waiting on a schedule's return value, deployed or locally.
const getProcessAutoRespond = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventAutoRespondBase> => {
  return async () => {
    return actionResult(null);
  };
};

export const getEventAutoRespondActionProcessor = createActionProcessor(askEventAutoRespondBase, getProcessAutoRespond);
