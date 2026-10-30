import { actionResult, askLogCreate, createActionProcessor, ProcessorFor, QPQConfig } from '@qpqjs/core';

const getProcessLogCreate = (qpqConfig: QPQConfig): ProcessorFor<typeof askLogCreate> => {
  return async ({ msg, logLevel, data }) => {
    // Presence check, not truthiness: falsy payloads like 0 or false still get logged.
    if (data !== undefined) {
      console.log(`${logLevel}: ${msg}`, data);
    } else {
      console.log(`${logLevel}: ${msg}`);
    }

    return actionResult(undefined);
  };
};

export const getLogCreateActionProcessor = createActionProcessor(askLogCreate, getProcessLogCreate);
