import {
  actionResult,
  askUserDirectoryChangePassword,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  UserDirectoryActionType,
} from 'quidproquo-core';

const getProcessChangePassword = (_qpqConfig: QPQConfig): ProcessorFor<typeof askUserDirectoryChangePassword> => {
  return async () => {
    // Passwords are not stored in dev
    return actionResult(void 0);
  };
};

export const getUserDirectoryChangePasswordActionProcessor = createActionProcessor(askUserDirectoryChangePassword, getProcessChangePassword);
