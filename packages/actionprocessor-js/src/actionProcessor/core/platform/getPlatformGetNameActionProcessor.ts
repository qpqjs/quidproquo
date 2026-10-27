import { actionResult, askPlatformGetName, createActionProcessor, ProcessorFor, QPQConfig } from '@qpqjs/core';

/** Answers askPlatformGetName with the name the composing runtime passes in. */
export const getPlatformGetNameActionProcessor = (platformName: string) => {
  const getProcessPlatformGetName = (qpqConfig: QPQConfig): ProcessorFor<typeof askPlatformGetName> => {
    return async () => actionResult(platformName);
  };

  return createActionProcessor(askPlatformGetName, getProcessPlatformGetName);
};
