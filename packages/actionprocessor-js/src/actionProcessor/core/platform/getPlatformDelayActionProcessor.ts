import { actionResult, askDelay, createActionProcessor, ProcessorFor, QPQConfig } from 'quidproquo-core';

const getProcessPlatformDelay = (qpqConfig: QPQConfig): ProcessorFor<typeof askDelay> => {
  return async ({ timeMs }) => {
    return new Promise((resolve) => setTimeout(() => resolve(actionResult(undefined)), timeMs));
  };
};

export const getPlatformDelayActionProcessor = createActionProcessor(askDelay, getProcessPlatformDelay);
