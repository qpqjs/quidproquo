import { actionResult, askUserDirectorySetPassword, createActionProcessor, ProcessorFor, QPQConfig, UserDirectoryActionType } from 'quidproquo-core';

const getProcessSetPassword = (_qpqConfig: QPQConfig): ProcessorFor<typeof askUserDirectorySetPassword> => {
  return async () => {
    // Passwords are not stored in dev
    return actionResult(void 0);
  };
};

export const getUserDirectorySetPasswordActionProcessor = createActionProcessor(askUserDirectorySetPassword, getProcessSetPassword);
