import {
  actionResult,
  askUserDirectoryConfirmEmailVerification,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  UserDirectoryActionType,
} from '@qpqjs/core';

const getProcessConfirmEmailVerification = (qpqConfig: QPQConfig): ProcessorFor<typeof askUserDirectoryConfirmEmailVerification> => {
  return async () => {
    // Any verification code is accepted in dev
    return actionResult(undefined);
  };
};

export const getUserDirectoryConfirmEmailVerificationActionProcessor = createActionProcessor(
  askUserDirectoryConfirmEmailVerification,
  getProcessConfirmEmailVerification,
);
