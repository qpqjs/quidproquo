import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askUserDirectoryConfirmEmailVerification,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  UserDirectoryActionType,
} from 'quidproquo-core';

import { verifyUserEmail } from '../../../logic/cognito/verifyUserEmail';

const getProcessConfirmEmailVerification = (qpqConfig: QPQConfig): ProcessorFor<typeof askUserDirectoryConfirmEmailVerification> => {
  return async ({ code, accessToken }) => {
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    try {
      await verifyUserEmail(region, accessToken, code);

      return actionResult(void 0);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        CodeMismatchException: () =>
          actionResultError(askUserDirectoryConfirmEmailVerification.errorType.InvalidCode, 'Verification code is incorrect'),
        ExpiredCodeException: () =>
          actionResultError(askUserDirectoryConfirmEmailVerification.errorType.ExpiredCode, 'Verification code has expired'),
        LimitExceededException: () =>
          actionResultError(askUserDirectoryConfirmEmailVerification.errorType.LimitExceeded, 'Too many attempts, please try again later'),
      });
    }
  };
};

export const getUserDirectoryConfirmEmailVerificationActionProcessor = createActionProcessor(
  askUserDirectoryConfirmEmailVerification,
  getProcessConfirmEmailVerification,
);
