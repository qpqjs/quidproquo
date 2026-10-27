import {
  actionResult,
  askUserDirectoryConfirmEmailVerification,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  UserDirectoryActionType,
} from 'quidproquo-core';

const getProcessConfirmEmailVerification = (_qpqConfig: QPQConfig): ProcessorFor<typeof askUserDirectoryConfirmEmailVerification> => {
  return async () => {
    // Any verification code is accepted in dev
    return actionResult(void 0);
  };
};

export const getUserDirectoryConfirmEmailVerificationActionProcessor = createActionProcessor(
  askUserDirectoryConfirmEmailVerification,
  getProcessConfirmEmailVerification,
);
