import { actionResult, askUserDirectoryChangePassword, createActionProcessor, ProcessorFor, QPQConfig } from '@qpqjs/core';

const getProcessChangePassword = (qpqConfig: QPQConfig): ProcessorFor<typeof askUserDirectoryChangePassword> => {
  return async () => {
    // Passwords are not stored in dev
    return actionResult(undefined);
  };
};

export const getUserDirectoryChangePasswordActionProcessor = createActionProcessor(askUserDirectoryChangePassword, getProcessChangePassword);
