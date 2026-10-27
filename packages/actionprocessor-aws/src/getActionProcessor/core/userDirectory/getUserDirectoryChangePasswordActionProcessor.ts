import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askUserDirectoryChangePassword,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  UserDirectoryActionType,
} from 'quidproquo-core';

import { changePassword } from '../../../logic/cognito/changePassword';

const getProcessChangePassword = (qpqConfig: QPQConfig): ProcessorFor<typeof askUserDirectoryChangePassword> => {
  return async ({ oldPassword, newPassword, accessToken }) => {
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    try {
      await changePassword(accessToken, oldPassword, newPassword, region);

      return actionResult(void 0);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        NotAuthorizedException: () => actionResultError(askUserDirectoryChangePassword.errorType.IncorrectPassword, 'Current password is incorrect'),
        InvalidPasswordException: () =>
          actionResultError(askUserDirectoryChangePassword.errorType.InvalidNewPassword, 'New password does not meet the password policy'),
        LimitExceededException: () =>
          actionResultError(askUserDirectoryChangePassword.errorType.LimitExceeded, 'Too many attempts, please try again later'),
      });
    }
  };
};

export const getUserDirectoryChangePasswordActionProcessor = createActionProcessor(askUserDirectoryChangePassword, getProcessChangePassword);
