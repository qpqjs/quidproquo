import { actionResult, askRedactString, createActionProcessor, ProcessorFor, QPQConfig } from '@qpqjs/core';

// Nothing to do at runtime: the action exists so the value lands in the story's log, where the admin
// log redaction finds it and removes it from every string in that log.
const getProcessLogRedactString = (qpqConfig: QPQConfig): ProcessorFor<typeof askRedactString> => {
  return async () => actionResult(undefined);
};

export const getLogRedactStringActionProcessor = createActionProcessor(askRedactString, getProcessLogRedactString);
