import { actionResult, askDateNow, createActionProcessor, getQpqIsoDateTimeFromDate, ProcessorFor, QPQConfig } from 'quidproquo-core';

const getProcessDateNow = (qpqConfig: QPQConfig): ProcessorFor<typeof askDateNow> => {
  return async () => {
    return actionResult(getQpqIsoDateTimeFromDate(new Date()));
  };
};

export const getDateNowActionProcessor = createActionProcessor(askDateNow, getProcessDateNow);
