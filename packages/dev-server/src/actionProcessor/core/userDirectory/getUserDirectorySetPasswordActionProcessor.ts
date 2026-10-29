import { actionResult, askUserDirectorySetPassword, createActionProcessor, ProcessorFor, QPQConfig, UserDirectoryActionType } from '@qpqjs/core';

const getProcessSetPassword = (qpqConfig: QPQConfig): ProcessorFor<typeof askUserDirectorySetPassword> => {
  return async () => {
    // Passwords are not stored in dev
    return actionResult(undefined);
  };
};

export const getUserDirectorySetPasswordActionProcessor = createActionProcessor(askUserDirectorySetPassword, getProcessSetPassword);
