import { actionResult, askPlatformGetName, createActionProcessor, ProcessorFor, QPQConfig } from 'quidproquo-core';

/** Answers askPlatformGetName with the name the composing runtime passes in. */
export const getPlatformGetNameActionProcessor = (platformName: string) => {
  const getProcessPlatformGetName = (qpqConfig: QPQConfig): ProcessorFor<typeof askPlatformGetName> => {
    return async () => actionResult(platformName);
  };

  return createActionProcessor(askPlatformGetName, getProcessPlatformGetName);
};
