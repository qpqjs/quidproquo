import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askUserDirectorySignOutUser,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  UserDirectoryActionType,
} from 'quidproquo-core';

import { globalSignOut } from '../../../logic/cognito/globalSignOut';

const getProcessSignOutUser = (qpqConfig: QPQConfig): ProcessorFor<typeof askUserDirectorySignOutUser> => {
  return async ({ accessToken }) => {
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    try {
      await globalSignOut(accessToken, region);

      return actionResult(void 0);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        NotAuthorizedException: () => actionResultError(askUserDirectorySignOutUser.errorType.Unauthorized, 'Access token is invalid or has expired'),
        TooManyRequestsException: () =>
          actionResultError(askUserDirectorySignOutUser.errorType.LimitExceeded, 'Too many attempts, please try again later'),
      });
    }
  };
};

export const getUserDirectorySignOutUserActionProcessor = createActionProcessor(askUserDirectorySignOutUser, getProcessSignOutUser);
