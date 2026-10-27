import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askUserDirectorySetPassword,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  UserDirectoryActionType,
} from 'quidproquo-core';

import { getCFExportNameUserPoolIdFromConfig } from '../../../awsNamingUtils';
import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';
import { resolveUsernameByPreferredUsername } from '../../../logic/cognito/resolveUsernameByPreferredUsername';
import { setUserPassword } from '../../../logic/cognito/setUserPassword';

const getProcessSetPassword = (qpqConfig: QPQConfig): ProcessorFor<typeof askUserDirectorySetPassword> => {
  return async ({ userDirectoryName, newPassword, username }) => {
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    const userPoolId = await getExportedValue(getCFExportNameUserPoolIdFromConfig(userDirectoryName, qpqConfig), region);

    const resolvedUsername = await resolveUsernameByPreferredUsername(userPoolId, region, username);

    try {
      await setUserPassword(region, userPoolId, resolvedUsername, newPassword);

      return actionResult(void 0);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        UserNotFoundException: () => actionResultError(askUserDirectorySetPassword.errorType.UserNotFound, 'No account found for this user'),
        InvalidPasswordException: () =>
          actionResultError(askUserDirectorySetPassword.errorType.InvalidNewPassword, 'Password does not meet the password policy'),
        LimitExceededException: () =>
          actionResultError(askUserDirectorySetPassword.errorType.LimitExceeded, 'Too many attempts, please try again later'),
        TooManyRequestsException: () =>
          actionResultError(askUserDirectorySetPassword.errorType.LimitExceeded, 'Too many attempts, please try again later'),
      });
    }
  };
};

export const getUserDirectorySetPasswordActionProcessor = createActionProcessor(askUserDirectorySetPassword, getProcessSetPassword);
