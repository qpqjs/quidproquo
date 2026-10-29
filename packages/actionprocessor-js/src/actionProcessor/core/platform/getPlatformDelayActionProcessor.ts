import { actionResult, askPlatformDelay, createActionProcessor, ProcessorFor, QPQConfig } from '@qpqjs/core';

const getProcessPlatformDelay = (qpqConfig: QPQConfig): ProcessorFor<typeof askPlatformDelay> => {
  return async ({ timeMs }) => {
    return new Promise((resolve) => setTimeout(() => resolve(actionResult(undefined)), timeMs));
  };
};

export const getPlatformDelayActionProcessor = createActionProcessor(askPlatformDelay, getProcessPlatformDelay);
